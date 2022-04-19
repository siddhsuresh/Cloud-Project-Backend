/* eslint strict:"off" */
"use strict";
const fastify = require("fastify");
const {
  socketRoutes,
  allHeatReadings,
  esp32req,
  esp8266acks
} = require("./socket.js");

var allSoilReadings = [];
var allReadings = [];
// var currentState = false;

function build(opts) {
  const app = fastify(opts);
  app.register(require('fastify-cors'))
  socketRoutes(app, {
    cors: {
      origin: "*"
    }
  });

  app.get("/", async (request, reply) => {
    return { "CSE2021 DRTS Project API": "20BPS1042 Siddharth Suresh" };
  });
  app.get("/responseTime", async (request, reply) => {
    return {
      esp32req: esp32req,
      esp8266acks: esp8266acks
    };
  });
  app.post("/soil", async (request, reply) => {
    app.io.emit("esp32",true);
    app.io.emit("esp32req",request.body.time)
    console.log("Soil: ", request.body.soil);
    const soilReading = parseInt(request.body);
    if (soilReading >= 3500 ) {
      app.io.emit("pumpState", "ON");
      console.log("Pump ON");
      allSoilReadings.push({
        group:"soil",
        soil: soilReading,
        time: new Date(),
        state: true
      });
    } else if(soilReading < 3500) {
      app.io.emit("pumpState", "OFF");
      console.log("Pump OFF");
      allSoilReadings.push({
        group: "soil",
        soil: soilReading,
        time: new Date(),
        state: false
      });
    }
    app.io.emit("soil", soilReading);
    reply.code(204);
  });
  app.post("/temp", async (request, reply) => {
    console.log("Heat Index: ", request.body);
    const tempReading = Number(request.body);
    if (tempReading >= 24) {
      app.io.emit("setSpeed", "HIGH");
    } else {
      app.io.emit("setSpeed", "LOW");
    }
    allHeatReadings.push({
      group: "heat",
      heat: tempReading,
      time: new Date()
    });
    reply.code(204);
  });
  app.post("/esp32req", async (request, reply) => {
    console.log("esp32req: ", request.body);
    app.io.emit("esp8266req",request.body);
    reply.code(204);
  });
  app.get(
    "/API",
    async (request, reply) => {
      function setesp32Disconnect() {
        app.io.emit("esp32",false);
      }
      setTimeout(setesp32Disconnect, 3000);
      //Clear all readings
      allReadings = [];
      allReadings.push(...allSoilReadings);
      allReadings.push(...allHeatReadings);
      return {
        // return all
        readings: allReadings
      };
    }
  );
  app.get("/currentTime", async (request, reply) => {
    return {
      currentTime: new Date()
      };
  });
  return app;
}

module.exports = {
  build
};
