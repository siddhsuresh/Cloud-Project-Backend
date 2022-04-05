const fastifyIO = require("fastify-socket.io");

function socketRoutes(app, opts) {
  app.register(fastifyIO, opts);
  app.ready().then(() => {
    // we need to wait for the server to be ready, else `server.io` is undefined
    app.io.on("connection", (socket) => {
      console.log("a user connected");
      // socket.on("dht", (data) => {
      //   console.log("Temperature: ", data.temp);
      //   app.io.emit("temp", data.temp);
      //   latestReadings["temp"] = data.temp;
      //   console.log("Humidity: ", data.hum);
      //   app.io.emit("hum", data.hum);
      //   latestReadings["hum"] = data.hum;
      //   console.log("heatindex", data.heatindex);
      //   app.io.emit("heatindex", data.heatindex);
      //   latestReadings["heat"] = data.heatindex;
      //   allHeatReadings.push({
      //     temp: data.temp,
      //     hum: data.hum,
      //     heat: data.heatindex
      //   });
      // });
      socket.on("soil", (data) => {
        //covert string to number
        data = parseInt(data);
        console.log("Soil Mositure: ", data);
        app.io.emit("soil", data);
      });
      socket.on("pumpState", (data) => {
        console.log("Pump State: ", data);
        app.io.emit("pumpState", data);
      });
      socket.on("setSpeed", (data) => {
        console.log("Speed: ", data);
        app.io.emit("setSpeed", data);
      });
      socket.on("disconnect", () => {
        console.log("user disconnected");
      });
    });
  });

  return app;
}

module.exports = {
  socketRoutes
};
