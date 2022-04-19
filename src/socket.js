const fastifyIO = require("fastify-socket.io");

var allHeatReadings = [];
var esp8266acks = [];

function socketRoutes(app, opts) {
  app.register(fastifyIO, opts);
  app.ready().then(() => {
    // we need to wait for the server to be ready, else `server.io` is undefined
    app.io.on("connection", (socket) => {
      console.log("a user connected");
      socket.on("esp8266",(data)=>{
        console.log("esp8266 ",data);
        app.io.emit("esp8266", data);
      })
      socket.on("esp8266ack",(data)=>{
        console.log("esp8266ack ",data);
        esp8266acks.push({
          id: esp8266acks.length,
          time:data
        });
        app.io.emit("esp8266ack", data);
      })
      socket.on("esp32",(data)=>{
        console.log("esp32 ",data);
        app.io.emit("esp32", data);
      })
      socket.on("dht", (data) => {
        app.io.emit("esp8266",true);
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
        app.io.emit("esp8266",false);
        console.log("user disconnected");
      });
    });
  });

  return app;
}

module.exports = {
  socketRoutes, allHeatReadings, esp8266acks
};
