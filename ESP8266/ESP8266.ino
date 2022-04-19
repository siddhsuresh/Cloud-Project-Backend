#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WiFiClient.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <WebSocketsClient.h>
#include <SocketIOclient.h>
#include <Hash.h>
#include <DHT.h> // including the library of DHT11 temperature and humidity sensor

#define DHTTYPE DHT11 // DHT 11
#define LED D0

ESP8266WiFiMulti WiFiMulti;
SocketIOclient socketIO;

const char *ssid = "ASUS ZENFONE";      // WiFi Name
const char *password = "siddharth1243"; // WiFi Password

HTTPClient http;
WiFiClient client;

#define dht_dpin 0 // The GPIO Pin Number Used to Connect To the DHT11 Sensor
DHT dht(dht_dpin, DHTTYPE);

// Motor A connections
int enA = 2;
int in1 = 4;
int in2 = 5;
// int LEDout = 15; // Assign LED pin i.e: D1 on NodeMCU

void socketIOEvent(socketIOmessageType_t type, uint8_t *payload, size_t length)
{
  bool speed;
  DynamicJsonDocument state(1024);
  DeserializationError error;
  String eventName;
  switch (type)
  {
  case sIOtype_DISCONNECT:
    Serial.printf("[IOc] Disconnected!\n");
    break;
  case sIOtype_CONNECT:
    Serial.printf("[IOc] Connected to url: %s\n", payload);
    // join default namespace (no auto join in Socket.IO V3)
    socketIO.send(sIOtype_CONNECT, "/");
    break;
  case sIOtype_EVENT:
  {
    Serial.printf("[IOc] get event: %s\n", payload);
    error = deserializeJson(state, payload, length);
    if (error)
    {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());
      return;
    }
    JsonArray array = state.as<JsonArray>();
    for (JsonVariant v : array)
    {
      Serial.println(v.as<String>());
    }
    if (array[0] == "pumpState")
    {
      http.useHTTP10(true);
      http.begin(client,"https://drts-jcomp-20bps1042.herokuapp.com/currentTime");
      http.addHeader("Content-Type", "text/plain");
      int httpCode = http.GET(); // Send the request
      if (httpCode == 200)
      {
        Serial.println("[HTTP] GET /currentTime successful");
        DynamicJsonDocument doct(2048),doc(2048);
        deserializeJson(doct, http.getStream());
        String time = doct["currentTime"].as<String>();
        JsonArray array = doc.to<JsonArray>();
        array.add("esp8266ack");
        array.add(time);        
        String output;
        serializeJson(doc, output);
        // Send event
        socketIO.sendEVENT(output);
      }
      else
      {
        Serial.println("[HTTP] GET /currentTime failed");
      }
      if (array[1] == "ON")
      {
        if (speed)
        {
          analogWrite(enA, 255);
        }
        else
        {
          analogWrite(enA, 200);
        }
        digitalWrite(in1, LOW);
        digitalWrite(in2, HIGH);
      }
      else
      {
        analogWrite(enA, 0);
      }
    }
    if (array[0] == "setSpeed")
    {
      if (array[1] == "HIGH")
      {
        speed = true;
      }
      else
      {
        speed = false;
      }
    }
    break;
  }
  case sIOtype_ACK:
    Serial.printf("[IOc] get ack: %u\n", length);
    hexdump(payload, length);
    break;
  case sIOtype_ERROR:
    Serial.printf("[IOc] get error: %u\n", length);
    hexdump(payload, length);
    break;
  case sIOtype_BINARY_EVENT:
    Serial.printf("[IOc] get binary: %u\n", length);
    hexdump(payload, length);
    break;
  case sIOtype_BINARY_ACK:
    Serial.printf("[IOc] get binary ack: %u\n", length);
    hexdump(payload, length);
    break;
  }
}

void setup()
{
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  // pinMode(LEDout, OUTPUT);
  // Serial.setDebugOutput(true);
  Serial.setDebugOutput(true);
  pinMode(enA, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  Serial.println();
  Serial.println();
  Serial.println();

  for (uint8_t t = 4; t > 0; t--)
  {
    Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  // disable AP
  if (WiFi.getMode() & WIFI_AP)
  {
    WiFi.softAPdisconnect(true);
  }

  WiFiMulti.addAP(ssid, password);

  // WiFi.disconnect();
  while (WiFiMulti.run() != WL_CONNECTED)
  {
    delay(100);
  }

  String ip = WiFi.localIP().toString();
  Serial.printf("[SETUP] WiFi Connected %s\n", ip.c_str());

  // server address, port and URL
  socketIO.begin("drts-jcomp-20bps1042.herokuapp.com", 80, "/socket.io/?EIO=4");

  // event handler
  socketIO.onEvent(socketIOEvent);
  dht.begin();
  digitalWrite(LED, HIGH);
}

unsigned long messageTimestamp = 0;
void loop()
{
  socketIO.loop();

  uint64_t now = millis();

  if (now - messageTimestamp > 8000)
  {
    messageTimestamp = now;
    float t = dht.readTemperature();
    Serial.print("temperature = ");
    Serial.print(t);
    Serial.println("C  ");
    if (WiFi.status() == WL_CONNECTED)
    {
      DynamicJsonDocument doc(1024);
      JsonArray array = doc.to<JsonArray>();
      array.add("dht");
      array.add(t);
      String output;
      serializeJson(doc, output);
      // Send event
      socketIO.sendEVENT(output);
      // Print JSON for debugging
      Serial.println(output);
    }
  }
}