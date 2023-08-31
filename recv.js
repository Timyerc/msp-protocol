/********************************
 * 
 * Notes: 
 * 
 * 
 * 
 * 
 *******************************/

(
    function main() {
        var codes = {
          MSP_IDENT:            100,
          MSP_STATUS:           101,
          MSP_RAW_IMU:          102,
          MSP_DATA_POINT:       103,
          MSP_GYRO_DETECT:      104,
          MSP_RC:               105,
          MSP_RAW_GPS:          106,
          MSP_COMP_GPS:         107,
          MSP_ATTITUDE:         108,
          MSP_ALTITUDE:         109,
          MSP_ANALOG:           110,
          MSP_ADAPTER:          111,
          MSP_PID:              112,
          MSP_BOX:              113,
          MSP_WATER_BOX:        114,
          MSP_MOTOR_PINS:       115,
          MSP_BOXNAMES:         116,
          MSP_PIDNAMES:         117,
          
          MSP_SET_RAW_RC:       200,
          MSP_SET_RAW_GPS:      201,
          MSP_SET_PID:          202,
          MSP_SET_BOX:          203,
          MSP_SET_RC_TUNING:    204,
          MSP_ACC_CALIBRATION:  205,
          MSP_MAG_CALIBRATION:  206,
          MSP_SET_MISC:         207,
          MSP_RESET_CONF:       208,
          MSP_SELECT_SETTING:   210,
          
          MSP_SET_TRIGGER:      215,
          
          MSP_BIND:             240,
          
          MSP_EEPROM_WRITE:     250,
          
          MSP_DEBUGMSG:         253,
          MSP_DEBUG:            254,
          
          // Additional baseflight commands that are not compatible with MultiWii
          MSP_UID:              160,
          MSP_ACC_TRIM:         240,
          MSP_SET_ACC_TRIM:     239,
          MSP_GPSSVINFO:        164 // get Signal Strength (only U-Blox)
        };
        
        code_to_name = {};

        for (var key in codes) {
          var value = codes[key];
          code_to_name[value] = key + "";
        }
        
        var message_decode = function (data) {
          var data = new Uint8Array(data);
        //   var message_status, message_checksum, message_code;
        //   var message_length_received = 0;
        //   var message_buffer_uint8_view = [];
        //   var message_buffer;
          
          if (typeof message_state == 'undefined') {
              message_state = 0;
          }
          
          if (typeof message_length_received == 'undefined') {
              message_length_received = 0;
          }
        
          for (var i = 0; i < data.length; i++) {
            switch (message_state) {
              case 0: // sync char 1
                if (data[i] == 0xFF) { // $
                  message_state++;
                }
                break;
              case 1: // sync char 2
                if (data[i] == 0xFF) { // M
                  message_state++;
                } else { // restart and try again
                  message_state = 0;
                }
                break;
              case 2:
                message_code = data[i]; // code
                message_checksum = data[i];
                message_state++;
                break;
              case 3:
                message_length_expected = data[i]; // data length
                message_checksum ^= data[i];
                message_buffer = new ArrayBuffer(message_length_expected);
                message_buffer_uint8_view = new Uint8Array(message_buffer);
                
                if (message_length_expected != 0) { // standard message
                  message_state++;
                } else { // MSP_ACC_CALIBRATION, etc...
                  message_state += 2;
                }
                break;
              case 4: // data / payload
                message_buffer_uint8_view[message_length_received] = data[i];
                message_checksum ^= data[i];
                message_length_received++;
                
                if (message_length_received >= message_length_expected) {
                  message_state++;
                }
                break;
              case 5: // CRC
                if (message_checksum == data[i]) {
                  // process data
                  var name = code_to_name[message_code];
                  console.log(name);
                  message_decode_payload(message_code, message_buffer);
                }
                // Reset variables
                message_length_received = 0;
                message_state = 0;           
                break;
            }
          }
        };
        
        var message_decode_payload = function (msp_code, data) {
          var view = new DataView(data, 0);
        
          var msp_code_name = code_to_name[msp_code];
          var payload = {};
          var out;
        
        
          var data_array_unit_parse = function (data, max, size) {
            size = size || 2;
        
            var size_to_getter = {
              1: 'getUint8',
              2: 'getUint16',
              4: 'getUint32'
            };
            var getter = size_to_getter[size];
            max = max || -1;
        
            var res = [];
            var view = new DataView(data, 0);
        
            for (var i = 0; i < data.byteLength; i += size) {
              var index = i / size;
              res[index] = view[getter](i, 1);
        
              if (max == index)
                return res;
            }
        
            return res;
          };
          
        
          switch (msp_code) {
            case codes.MSP_IDENT:
              break;
            case codes.MSP_STATUS:
              break;
            case codes.MSP_RAW_IMU:
              var readings = data_array_unit_parse(data);
              console.log(readings);
              payload.gyroscope = readings.slice(0, 3);
              payload.accelerometer = readings.slice(3, 6);
              
              gyro = new Int16Array(payload.gyroscope);
              acc = new Int16Array(payload.accelerometer);
        
              out = 'gx=' + gyro[0].toString() + ',gy=' + gyro[1].toString() + ',gz=' + gyro[2].toString() + ',ax=' + acc[0].toString() + ',ay=' + acc[1].toString() + ',az=' + acc[2].toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.MSP_DATA_POINT:
              payload.dp1 = view.getInt16(0, 1);
              payload.dp2 = view.getInt16(2, 1);
              out = 'dp1=' + (payload.dp1).toString() + ',dp2=' + (payload.dp2).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.MSP_GYRO_DETECT:
              payload.diff = view.getInt16(0, 1);
              payload.gz = view.getInt16(2, 1);
              out = 'diff=' + (payload.diff).toString() + ',gz=' + (payload.gz).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.MSP_SET_TRIGGER:
              payload.dp1 = view.getInt16(0, 1);
              payload.dp2 = view.getInt16(2, 1);
              out = 'dp1=' + (payload.dp1).toString() + ',dp2=' + (payload.dp2).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.MSP_MOTOR:
              break; 
            case codes.MSP_RC:
              break; 
            case codes.MSP_RAW_GPS:
              break; 
            case codes.MSP_COMP_GPS:
              break; 
            case codes.MSP_ATTITUDE:
              payload.eulerX = view.getInt16(0, 1);
              out = 'eulerx=' + (payload.eulerX).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break; 
            case codes.MSP_ALTITUDE:
              break; 
            case codes.MSP_ANALOG:
              payload.currL = view.getUint16(0, 1);
              payload.currR = view.getUint16(2, 1);
              payload.currF = view.getUint16(4, 1);
              out = 'currl=' + payload.currL.toString() + ',currr=' + payload.currR.toString() + ',currf=' + payload.currF.toString() + '\n';
              receive.write(out);
              chart.write(out);
              break; 
            case codes.MSP_ADAPTER:
              break; 
            case codes.MSP_PID:
              break; 
            case codes.MSP_BOX:
              break; 
            case codes.MSP_WATER_BOX:
              break; 
            case codes.MSP_MOTOR_PINS:
              break; 
            case codes.MSP_BOXNAMES:
              break; 
            case codes.MSP_PIDNAMES:
              break; 
            case codes.MSP_SET_RAW_RC:
              break; 
            case codes.MSP_SET_RAW_GPS:
              break; 
            case codes.MSP_SET_PID:
              break; 
            case codes.MSP_SET_BOX:
              break; 
            case codes.MSP_SET_RC_TUNING:
              break;  
            case codes.MSP_ACC_CALIBRATION:
              break;  
            case codes.MSP_MAG_CALIBRATION:
              break;  
            case codes.MSP_SET_MISC:
              break;  
            case codes.MSP_RESET_CONF:
              break;  
            case codes.MSP_SELECT_SETTING:
              break;
            case codes.MSP_EEPROM_WRITE:
              break;  
            case codes.MSP_DEBUGMSG:
              break;  
            case codes.MSP_DEBUG:
              break;
        
            // The following are Baseflight specific
            case codes.MSP_UID:
              break;
            case codes.MSP_ACC_TRIM:
              break;
            case codes.MSP_SET_ACC_TRIM:
              break;
            case codes.MSP_GPSSVINFO:
              break;
            default:
              break;
          }
        }
        
        var str=receive.getBytes(); //Read the Received string
        
        message_decode(str);
        
        var data = new Uint8Array(str);
        
        // console.log(data);

        //receive.write(str); //Show received string
        //receive.write(str,""Red""); // Shown in red

        return   ;
    }
)() 