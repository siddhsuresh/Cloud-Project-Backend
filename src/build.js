/* eslint strict:"off" */
"use strict";
const fastify = require("fastify");
const {
  socketRoutes,
  allHeatReadings,
  esp8266_isConnected
} = require("./socket.js");

var latestReadings = {};
var allSoilReadings = [];
var esp32_isConnected=false;

function setesp32Disconnect()
{
  esp32_isConnected=false;
}

setTimeout(setesp32Disconnect, 9500);

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
    esp32_isConnected=true;
    console.log("Soil: ", request.body);
    const soilReading = parseInt(request.body);
    latestReadings["soil"] = soilReading;
    if (soilReading >= 3500) {
      app.io.emit("pumpState", "ON");
      console.log("Pump ON");
      allSoilReadings.push({
        soil: soilReading,
        time: new Date(),
        state: true
      });
    } else {
      app.io.emit("pumpState", "OFF");
      console.log("Pump OFF");
      allSoilReadings.push({
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
    latestReadings["heat"] = request.body;
    if(request.body >= 24) {
      app.io.emit("setSpeed", "HIGH");
    } else {
      app.io.emit("setSpeed", "LOW");
    }
    allHeatReadings.push({
      heat: request.body,
      time: new Date()
    });
    reply.code(204);
  });
  app.get(
    "/API",
    {
      query: {
        q: {
          type: "string"
        }
      }
    },
    async (request, reply) => {
      const { q } = request.query;
      if (q && q === "latest") {
        console.log(latestReadings);
        return latestReadings;
      }
      if (q && q === "soil") {
        return allSoilReadings;
      }
      if (q && q === "dht") {
        return allHeatReadings;
      }
      if (q && q === "esp8266") {
        return esp8266_isConnected;
      }
      if (q && q === "esp32") {
        return esp32_isConnected;
      }
      return {
        // return all
        latest: latestReadings,
        soil: allSoilReadings,
        dht: allHeatReadings,
        esp8266: esp8266_isConnected,
        esp32: esp32_isConnected
      };
    }
  );
  return app;
}

module.exports = {
  build
};
