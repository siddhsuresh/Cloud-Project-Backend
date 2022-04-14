#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>

WiFiMulti WiFiMulti;

struct pinRead
{
  int pin;
  int value;
};

HTTPClient http;

const char *ssid = "ASUS ZENFONE";      // WiFi Name
const char *password = "siddharth1243"; // WiFi Password

QueueHandle_t queue;
int queueSize = 100;
void setup()
{

  Serial.begin(112500);
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
 
  queue = xQueueCreate(queueSize, sizeof(struct pinRead));
  if (queue == NULL)
  {
    Serial.println("Error creating the queue");
  }
  else
  {
    xTaskCreate(
        SoilSensor,    /* Task function. */
        "Soil Sensor", /* String with name of task. */
        10000,         /* Stack size in words. */
        NULL,          /* Parameter passed as input of the task */
        1,             /* Priority of the task. */
        NULL);         /* Task handle. */

    xTaskCreate(
        Send2Server,      /* Task function. */
        "Send To Server", /* String with name of task. */
        10000,            /* Stack size in words. */
        NULL,             /* Parameter passed as input of the task */
        2,                /* Priority of the task. */
        NULL);            /* Task handle. */
  }
}

void loop()
{
  delay(100000);
}

void SoilSensor(void *parameter)
{
  for (;;)
  {
    struct pinRead currentPinRead;
    currentPinRead.pin = 0;
    currentPinRead.value = analogRead(34);
    xQueueSend(queue, &currentPinRead, portMAX_DELAY);
    vTaskDelay(2000);
  }
  vTaskDelete(NULL);
}

void Send2Server(void *parameter)
{
  int element;

  for (;;)
  {
    struct pinRead currentPinRead;
    if (xQueueReceive(queue, &currentPinRead, portMAX_DELAY) == pdPASS)
    {
      Serial.print("Pin: ");
      Serial.print(currentPinRead.pin);
      Serial.print(" Value: ");
      Serial.println(currentPinRead.value);
      if (currentPinRead.pin == 0)
      {
        http.begin("https://drts-jcomp-20bps1042.herokuapp.com/soil");
        http.addHeader("Content-Type", "text/plain");
        int httpResponseCode = http.POST(String(currentPinRead.value));
        if (httpResponseCode > 0)
        {
          Serial.println(httpResponseCode); // Print return code
        }
        else
        {
          Serial.print("Error on sending POST: ");
          Serial.println(httpResponseCode);
        }
      }
    }
    vTaskDelay(10);
  }
  vTaskDelete(NULL);
}