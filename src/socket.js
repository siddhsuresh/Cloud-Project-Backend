const fastifyIO = require("fastify-socket.io");

var latestReadings = {
  soil: 1200,
  temp: 25,
  hum: 50,
  heat: 26
};

var allSoilReadins = [];

var allHeatReadings = [];

function socketRoutes(app, opts) {
  app.register(fastifyIO, opts);
  app.ready().then(() => {
    // we need to wait for the server to be ready, else `server.io` is undefined
    app.io.on("connection", (socket) => {
      console.log("a user connected");
      socket.on("dht", (data) => {
        console.log("Temperature: ", data.temp);
        app.io.emit("temp", data.temp);
        latestReadings["temp"] = data.temp;
        console.log("Humidity: ", data.hum);
        app.io.emit("hum", data.hum);
        latestReadings["hum"] = data.hum;
        console.log("heatindex", data.heatindex);
        app.io.emit("heatindex", data.heatindex);
        latestReadings["heat"] = data.heatindex;
        allHeatReadings.push({
          temp: data.temp,
          hum: data.hum,
          heat: data.heatindex
        });
      });
      socket.on("soil", (data) => {
        console.log("Soil Mositure: ", data);
        latestReadings["soil"] = data;
        allSoilReadins.push({
          soil: data
        });
        if (data >= 800) {
          app.io.emit("pumpState", "ON");
        } else {
          app.io.emit("pumpState", "OFF");
        }
        app.io.emit("soil", data);
      });
      socket.on("pumpState", (data) => {
        console.log("Pump State: ", data);
        app.io.emit("pumpState", data);
      });
      socket.on("disconnect", () => {
        console.log("user disconnected");
      });
    });
  });

  return app;
}

module.exports = {
  socketRoutes,
  latestReadings,
  allHeatReadings,
  allSoilReadins
};
