const fastifyIO = require("fastify-socket.io");

var allHeatReadings = [];
var esp8266_isConnected = false;
var esp8266_socketid = null;

function socketRoutes(app, opts) {
  app.register(fastifyIO, opts);
  app.ready().then(() => {
    // we need to wait for the server to be ready, else `server.io` is undefined
    app.io.on("connection", (socket) => {
      console.log("a user connected");
      socket.on("dht", (data) => {
        esp8266_isConnected = true;
        esp8266_socketid = socket.id;
        console.log("Temperature: ", data);
        app.io.emit("temp", data);
        if(data >= 32) {
          app.io.emit("setSpeed", "HIGH");
        } else {
          app.io.emit("setSpeed", "LOW");
        }
        allHeatReadings.push({
          heat: data,
          time: new Date()
        });
      });
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
        if(socket.id===esp8266_socketid) {
          esp8266_isConnected = false;
        }
        console.log("user disconnected");
      });
    });
  });

  return app;
}

module.exports = {
  socketRoutes, allHeatReadings, esp8266_isConnected
};
