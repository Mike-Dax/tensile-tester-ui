//Import the ElectricUI Library
#include "electricui.h"

// Simple variables to modify the LED behaviour
uint8_t movement_enabled = 1;
uint8_t led_state = 0;             // track if the LED is illuminated
uint16_t move_interval = 200;  // in milliseconds
uint16_t move_amount = 1;  // in displacement units

uint32_t movement_timer = 0;  // track when the light turned on or off

int8_t move_direction = 0;  // -1 for up, 0 for stopped, 1 for down

float force = 0.0;
float disp = 0.0;

// Instantiate the communication interface's management object
eui_interface_t serial_comms = EUI_INTERFACE(&serial_write);

// Electric UI manages variables referenced in this array
eui_message_t tracked_variables[] = {
  EUI_UINT8("mv_enabled", movement_enabled),
  EUI_UINT8("led_state", led_state),
  EUI_UINT16("mv_in", move_interval),
  EUI_UINT16("mv_am", move_amount),
  EUI_FLOAT("force", force),
  EUI_FLOAT("disp", disp),

  EUI_FUNC("up", up_callback),
  EUI_FUNC("down", down_callback),
  EUI_FUNC("stop", stop_callback),
};

void setup() {
  // Setup the serial port and status LED
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  // Provide the library with the interface we just setup
  eui_setup_interface(&serial_comms);

  // Provide the tracked variables to the library
  EUI_TRACK(tracked_variables);

  // Provide a identifier to make this board easy to find in the UI
  eui_setup_identifier("hello", 5);

  movement_timer = millis();
}

void loop() {
  serial_rx_handler();  //check for new inbound data

  if (movement_enabled) {
    if (millis() - movement_timer >= move_interval) {
      disp += (float)move_amount * (float)move_direction;
      movement_timer = millis();
      eui_send_tracked("disp");

      force = (float)random(0, disp);

      eui_send_tracked("force");

      led_state = !led_state;
    }
  }

  digitalWrite(LED_BUILTIN, led_state);  //update the LED to match the intended state
}

void serial_rx_handler() {
  // While we have data, we will pass those bytes to the ElectricUI parser
  while (Serial.available() > 0) {
    eui_parse(Serial.read(), &serial_comms);  // Ingest a byte
  }
}

void serial_write(uint8_t *data, uint16_t len) {
  Serial.write(data, len);  //output on the main serial port
}

void up_callback() {
  move_direction = -1;
}

void down_callback() {
  move_direction = 1;
}

void stop_callback() {
  move_direction = 0;
}
