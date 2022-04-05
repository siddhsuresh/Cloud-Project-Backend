/* eslint strict:"off" */
"use strict";
const fastify = require("fastify");
const {
  socketRoutes,
  allHeatReadings,
  allSoilReadins,
  latestReadings
} = require("./socket.js");

function build(opts) {
  const app = fastify(opts);

  socketRoutes(app, {
    cors: {
      origin: "*"
    }
  });

  app.get("/", async (request, reply) => {
    return { "CSE2021 DRTS Project API": "20BPS1042 Siddharth Suresh" };
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
        return allSoilReadins;
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
