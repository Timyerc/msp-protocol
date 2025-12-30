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
          CMD_RANGEFINDER:      97,
          
          MSP_IDENT:            100,
          CMD_SET_LINE_STATUS:           101,
          CMD_RAW_IMU:          102,
          CMD_GET_LINE_STATUS:  103,
          CMD_MOTOR_SPEED:      104,
          CMD_CROSS_BATT:       105,
          CMD_GET_EDGE_LINE_STATUS:    106,
          MSP_THRESHOLD:         107,
          CMD_ATTITUDE:         108,
          CMD_SYSTEM:           109,
          CMD_GET_REVEIVER:           110,
          MSP_ADAPTER:          111,
          CMD_MOTOR_STATUS:              112,
          MSP_BOX:              113,
          MSP_WATER_BOX:        114,
          MSP_MOTOR_PINS:       115,
          MSP_BOXNAMES:         116,
          MSP_FAST_CURRENT:     117,
          CMD_BATTERY_STATE:    130,
          CMD_DATA_POINT:       131,     
          CMD_GET_TEMP:         132,
          CMD_GET_MOVE_STATUS:  133,
          CMD_TEST_ODRIVE_IBUS: 170,
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
            case codes.CMD_RANGEFINDER:
              payload.dislf = view.getInt16(0, 1);
              payload.dislm = view.getInt16(2, 1);
              payload.dislb = view.getUint16(4, 1);
              payload.dislbm = view.getInt16(6, 1);
              payload.disrf = view.getInt16(8, 1);
              payload.disrm = view.getInt16(10, 1);
              payload.disrb = view.getInt16(12, 1);
              payload.disrbm = view.getInt16(14, 1);
              payload.ratel = view.getInt16(16, 1);
              payload.rater = view.getUint16(18, 1);
              out = 'dislf=' + (payload.dislf).toString() + ',dislm=' + (payload.dislm).toString() + ',dislb=' + (payload.dislb).toString() + ',dislbm=' + (payload.dislbm).toString() + ',disrf=' + (payload.disrf).toString() + ',disrm=' + (payload.disrm).toString() + ',disrb =' + (payload.disrb).toString() + ',disrbm=' + (payload.disrbm).toString() + ',ratel=' + (payload.ratel).toString() + ',rater=' + (payload.rater).toString() +'\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.MSP_IDENT:
              break;
            case codes.CMD_SET_LINE_STATUS:
              payload.busbarDis   = view.getInt16(0, 1);
              payload.busbarAngle = view.getInt16(2, 1);
              payload.gapDis      = view.getInt16(4, 1);
              payload.gapAngle    = view.getInt16(6, 1);
              payload.state       = view.getUint16(8, 1);
              out = 'busbarDis=' + (payload.busbarDis).toString() + ',busbarAngle=' + (payload.busbarAngle).toString() + ',gapDis=' + (payload.gapDis).toString() + ',gapAngle=' + (payload.gapAngle).toString() + ',state=' + (payload.state).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_TEST_ODRIVE_IBUS:
              payload.leftIbus = view.getInt32(0, 1);
              payload.rightIbus = view.getInt32(4, 1);
              out = 'leftIbus=' + (payload.leftIbus).toString() + ',rightIbus=' + (payload.rightIbus).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_RAW_IMU:
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
            case codes.CMD_GET_LINE_STATUS:
            //   payload.busdis = view.getInt16(0, 1);
            //   payload.busangle = view.getInt16(2, 1);
            //   payload.crossbatt = view.getInt16(4, 1);
            //   payload.gasangle = view.getInt16(6, 1);
            //   payload.frameRate = view.getInt16(8, 1);
            //   payload.state = view.getInt8(9, 1);
            //   out = 'busdis=' + (payload.busdis).toString() + ',busangle=' + (payload.busangle).toString() + ',crossbatt=' + (payload.crossbatt).toString() + ',gasangle=' + (payload.gasangle).toString() + ',frameRate=' + (payload.frameRate).toString() + ',state=' + (payload.state).toString() + '\n';
            //   receive.write(out);
            //   chart.write(out);
              
              payload.leftEdgeDis = view.getInt16(0, 1);
              payload.leftEdgeAngle = view.getInt16(2, 1);
              payload.rightEdgeDis = view.getInt16(4, 1);
              payload.rightEdgeAngle = view.getInt16(6, 1);
              payload.frontEdgeDis = view.getInt16(8, 1);
              payload.frontEdgeAngle = view.getInt16(10, 1);
              payload.frontDis = view.getInt16(12, 1);
              payload.frontAngle = view.getInt16(14, 1);
              payload.frameRate = view.getInt16(16, 1);
              payload.state = view.getInt8(18, 1);
              out = 'state=' + (payload.state).toString() + ',lEDis=' + (payload.leftEdgeDis).toString() + ',lEAngle=' + (payload.leftEdgeAngle).toString() + ',rEDis=' + (payload.rightEdgeDis).toString() +',rEAngle=' + (payload.rightEdgeAngle).toString() + ',fEDis=' + (payload.frontEdgeDis).toString() + ',fEAngle=' + (payload.frontEdgeAngle).toString() + ',fDis=' + (payload.frontDis).toString() + ',fAngle=' + (payload.frontAngle).toString() +',frameRate=' + (payload.frameRate).toString() +'\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_MOTOR_SPEED:
              payload.lspd = view.getInt32(0, 1);
              payload.rspd = view.getInt32(4, 1);
              payload.lspdBrush = view.getInt32(8, 1);
              payload.rspdBrush = view.getInt32(12, 1);
              payload.averageSpeed = view.getInt16(16, 1);
              payload.moveDis =  view.getInt16(18, 1);
              payload.odometer = view.getInt32(20, 1);
              out = 'lspd=' + (payload.lspd).toString() + ',rspd=' + (payload.rspd).toString() + '，lspdBrush=' + (payload.lspdBrush).toString() + ',rspdBrush=' + (payload.rspdBrush).toString() + ',averageSpeed=' + (payload.averageSpeed).toString() + ',moveDis=' + (payload.moveDis).toString() + ',odometer=' + (payload.odometer).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_CROSS_BATT:
              payload.cbatt = view.getInt16(0, 1);
              payload.sdis = view.getInt16(2, 1);
              out = 'cbatt=' + (payload.cbatt).toString() + ',sdis=' + (payload.sdis).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_GET_EDGE_LINE_STATUS:
              payload.state = view.getInt8(0, 1);
              payload.leftEdgeDis = view.getInt16(1, 1);
              payload.leftEdgeAngle = view.getInt16(3, 1);
              payload.rightEdgeDis = view.getInt16(5, 1);
              payload.rightEdgeAngle = view.getInt16(7, 1);
              payload.frontEdgeDis = view.getInt16(9, 1);
              payload.frontEdgeAngle = view.getInt16(11, 1);
              payload.frontDis = view.getInt16(13, 1);
              payload.frontAngle = view.getInt16(15, 1);
              out = 'state=' + (payload.state).toString() + ',lEDis=' + (payload.leftEdgeDis).toString() + 'lEAngle=' + (payload.leftEdgeAngle).toString() + ',rEDis=' + (payload.rightEdgeDis).toString() +'rEAngle=' + (payload.rightEdgeAngle).toString() + ',fEDis=' + (payload.frontEdgeDis).toString() + 'fEAngle=' + (payload.frontEdgeAngle).toString() + ',fDis=' + (payload.frontDis).toString() + ',fAngle=' + (payload.frontAngle).toString() +'\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.MSP_THRESHOLD:
              payload.mthr = view.getInt16(0, 1);
              payload.fthr = view.getInt16(2, 1);
              out = 'mthr=' + (payload.mthr).toString() + ',fthr=' + (payload.fthr).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break; 
            case codes.CMD_ATTITUDE:
              payload.yaw = view.getInt16(0, 1);
              payload.pitch = view.getInt16(2, 1);
              payload.roll = view.getInt16(4, 1);
              out = 'yaw=' + (payload.yaw).toString() + ',pitch=' + (payload.pitch).toString() + ',roll=' + (payload.roll).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break; 
            case codes.CMD_SYSTEM:
              payload.load = view.getUint16(0, 1);
              payload.taskpid = view.getUint16(2, 1);
              payload.taskacc = view.getUint16(4, 1);
               payload.rangefinder = view.getUint16(4, 1);
              out = 'load=' + payload.load.toString() + ',taskpid=' + payload.taskpid.toString() + ',taskacc=' + payload.taskacc.toString() + ',rangefinder=' + payload.rangefinder.toString() + '\n';
              receive.write(out);
              chart.write(out); 
              break; 
            case codes.CMD_GET_REVEIVER:
              payload.thr = view.getUint16(0, 1);
              payload.yaw = view.getUint16(2, 1);
              payload.mode = view.getUint16(4, 1);
              payload.sucker = view.getUint16(6, 1);
              payload.brush = view.getUint16(8, 1);
              payload.fail = view.getUint16(10, 1);
              out = 'thr=' + payload.thr.toString() + ',yaw=' + payload.yaw.toString() + ',mode=' + payload.mode.toString() + ',sucker=' + payload.sucker.toString() + ',brush=' + payload.brush.toString() + ',fail=' + payload.fail.toString() + '\n';
              receive.write(out);
              chart.write(out);
              break; 
            case codes.CMD_BATTERY_STATE:
              payload.battVol = view.getUint16(0, 1);
              payload.battState = view.getUint8(2, 1);
              //payload.battadc = view.getUint16(3, 1);
              out = 'battVol=' + (payload.battVol).toString() + ',battState=' + (payload.battState).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break; 
            case codes.CMD_DATA_POINT:
              payload.leftOut  = view.getInt16(0, 1);
              payload.rightOut = view.getInt16(2, 1);
              payload.speedCtrlOut = view.getInt16(4, 1);
              payload.error = view.getInt16(6, 1);
              out = 'speedCtrlOut=' + (payload.speedCtrlOut).toString() + ',leftOut=' + (payload.leftOut).toString() + ',rightOut=' + (payload.rightOut).toString() + ',error=' + (payload.error).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_MOTOR_STATUS:
              payload.lError = view.getUint8(0, 1);
              payload.rError = view.getUint8(1, 1);
              out = 'lError=' + (payload.lError).toString() + ',rError=' + (payload.rError).toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_GET_TEMP:
              payload.temp = view.getUint16(0, 1);
              out = 'temp=' + payload.temp.toString() + '\n';
              receive.write(out);
              chart.write(out);
              break;
            case codes.CMD_GET_MOVE_STATUS:
              payload.mode = view.getUint8(0, 1);
              payload.state = view.getUint8(1, 1);
              out = 'mode=' + payload.mode.toString() + 'state=' + payload.state.toString() +'\n';
              receive.write(out);
              chart.write(out);
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