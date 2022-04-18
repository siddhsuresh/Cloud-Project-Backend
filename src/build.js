/* eslint strict:"off" */
"use strict";
const fastify = require("fastify");
const {
  socketRoutes,
  allHeatReadings,
} = require("./socket.js");

var allSoilReadings = [];
var allReadings = [];

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
  app.post("/soil", async (request, reply) => {
    app.io.emit("esp32",true);
    console.log("Soil: ", request.body);
    const soilReading = parseInt(request.body);
    if (soilReading >= 3500) {
      app.io.emit("pumpState", "ON");
      console.log("Pump ON");
      allSoilReadings.push({
        group:"soil",
        soil: soilReading,
        time: new Date(),
        state: true
      });
    } else {
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
    if (request.body >= 24) {
      app.io.emit("setSpeed", "HIGH");
    } else {
      app.io.emit("setSpeed", "LOW");
    }
    allHeatReadings.push({
      group: "heat",
      heat: request.body,
      time: new Date()
    });
    reply.code(204);
  });
  app.get(
    "/API",
    async (request, reply) => {
      function setesp32Disconnect() {
        app.io.emit("esp32",false);
        esp32_isConnected = false;
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
  return app;
}

module.exports = {
  build
};
