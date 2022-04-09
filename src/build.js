/* eslint strict:"off" */
"use strict";
const fastify = require("fastify");
const {
  socketRoutes,
} = require("./socket.js");

var latestReadings = {};
var allSoilReadings = [];
var allHeatReadings = [];

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
    console.log("Soil: ", request.body);
    const soilReading = parseInt(request.body);
    allSoilReadings.push({
      soil: soilReading,
      time: new Date()
    });
    latestReadings["soil"] = soilReading;
    if (soilReading >= 4000) {
      app.io.emit("pumpState", "ON");
    } else {
      app.io.emit("pumpState", "OFF");
    }
    app.io.emit("soil", soilReading);
    reply.code(204);
  });
  app.post("/temp", async (request, reply) => {
    console.log("Temperature: ", request.body);
    latestReadings["temp"] = request.body;
    reply.code(204);
  });
  app.post("/hum", async (request, reply) => {
    console.log("Humidity: ", request.body);
    latestReadings["hum"] = request.body;
    reply.code(204);
  });
  app.post("/heat", async (request, reply) => {
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
      return {
        error: "404 - No Such Page In The Api"
      };
    }
  );
  return app;
}

module.exports = {
  build
};
