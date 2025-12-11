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
            MSP_EDGE_BOTTOM_DETECT: 105,
            MSP_MACHINE_STATE:    106,
            MSP_THRESHOLD:        107,
            MSP_ATTITUDE:         108,
            MSP_ANALOG:           110,
            MSP_ADAPTER:          111,
            MSP_BARO_DIFF:        113,
            MSP_WATER_BOX:        114,
            MSP_WIFI_RSSI:        115,
            MSP_WIFI_TEST:        116,
            MSP_FAST_CURRENT:     117,
            MSP_Z_TURN_FAST_CURRENT: 118,
            MSP_SYSTICK:          120,
            MSP_ORIGIN_ARGS:      121,
            MSP_MOTOR_CURRENT:    123,
            MSP_GET_FAN_PID_RESULT: 142,

            MSP_ACC_CALIBRATION:  205,
            MSP_PLAY_VOICE:       208,
            MSP_SET_SPRAY:        209,
            MSP_SET_FAN:          211,
            MSP_SET_MOTOR:        214,
            MSP_SET_TRIGGER:      215,
            MSP_SET_TRIGGER_2:    216,

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
                    payload.dp3 = view.getInt16(4, 1);
                    out = 'dp1=' + (payload.dp1).toString() + ',dp2=' + (payload.dp2).toString() + ',dp3=' + (payload.dp3).toString()  + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_GYRO_DETECT:
                    payload.diff = view.getInt16(0, 1);
                    payload.tick = view.getInt16(2, 1);
                    out = 'diff=' + (payload.diff).toString() + ',tick=' + (payload.tick).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_EDGE_BOTTOM_DETECT:
                    payload.diff1 = view.getInt16(0, 1);
                    payload.diff2 = view.getInt16(2, 1);
                    payload.gyroz = view.getInt16(4, 1);
                    out = 'diff1=' + (payload.diff1).toString() + ',diff2=' + (payload.diff2).toString() + ',gyroz=' + (payload.gyroz).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_MACHINE_STATE:
                    payload.state = view.getUint16(0, 1);
                    payload.ax = view.getUint16(2, 1);
                    payload.ay = view.getUint16(4, 1);
                    payload.az = view.getUint16(6, 1);
                    out = 'state=' + payload.state.toString() + ',ax=' + payload.ax.toString() + ',ay=' + payload.ay.toString() + ',az=' + payload.az.toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_THRESHOLD:
                    payload.thres = view.getUint16(0, 1);
                    payload.minCnt = view.getUint16(2, 1);
                    payload.maxCnt = view.getUint16(4, 1);
                    payload.target = view.getUint16(6, 1);
                    out = 'thres=' + payload.thres.toString() + ',minCnt=' + payload.minCnt.toString() + ',maxCnt=' + payload.maxCnt.toString() + ',target=' + payload.target.toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_ATTITUDE:
                    payload.eulerX = view.getInt16(0, 1);
                    payload.eulerY = view.getInt16(2, 1);
                    payload.eulerZ = view.getInt16(4, 1);
                    out = 'eulerx=' + (payload.eulerX).toString() + ',eulery=' + (payload.eulerY).toString() + ',eulerz=' + (payload.eulerZ).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_ANALOG:
                    payload.currl = view.getUint16(0, 1);
                    payload.currr = view.getUint16(2, 1);
                    payload.currf = view.getUint16(4, 1);
                    out = 'currl=' + payload.currl.toString() + ',currr=' + payload.currr.toString() + ',currf=' + payload.currf.toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_ADAPTER:
                    payload.va = view.getUint16(0, 1);
                    payload.vb = view.getUint16(2, 1);
                    out = 'va=' + payload.va.toString() + ',vb=' + payload.vb.toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_BARO_DIFF:
                    payload.barodiff = view.getInt16(0, 1);
                    payload.baro = view.getUint32(2, 1);
                    payload.std = view.getUint32(6, 1);
                    out = 'barodiff=' + payload.barodiff.toString() + ',baro=' + payload.baro.toString() + ',std=' + payload.std.toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_WATER_BOX:
                    payload.wreal = view.getUint8(0, 1);
                    payload.wadc = view.getUint16(1, 1);
                    payload.wstatus = view.getUint16(3, 1);
                    out = 'wreal=' + payload.wreal.toString() + ',wadc=' + payload.wadc.toString() + ',wstatus=' + payload.wstatus.toString() + '\n';
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
                case codes.MSP_SET_TRIGGER_2:
                    payload.real = view.getInt16(0, 1);
                    payload.target = view.getInt16(2, 1);
                    payload.pwm = view.getInt16(4, 1);
                    payload.out = view.getInt16(6, 1);
                    out = 'real=' + (payload.real).toString() + ',target=' + (payload.target).toString() + ',output=' + (payload.out).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_ORIGIN_ARGS:
                    payload.y2top = view.getInt16(0, 1);
                    payload.x2right = view.getInt16(2, 1);
                    payload.xtotal = view.getInt16(4, 1);
                    payload.xrun = view.getInt16(6, 1);
                    out = 'y2top=' + (payload.y2top).toString() + ',x2right=' + (payload.x2right).toString() + ',xtotal=' + (payload.xtotal).toString()+ ',xrun=' + (payload.xrun).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_MOTOR_CURRENT:
                    payload.curl = view.getInt16(0, 1);
                    payload.curr = view.getInt16(2, 1);
                    out = 'curl=' + (payload.curl).toString() + ',curr=' + (payload.curr).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break;
                case codes.MSP_SYSTICK:
                    payload.tick = view.getInt16(0, 1);
                    out = 'tick=' + (payload.tick).toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break; 
                case codes.MSP_GET_FAN_PID_RESULT:
                    payload.target = view.getInt32(0, 1);
                    payload.real = view.getInt32(4, 1);
                    out = 'target=' + payload.target.toString() + ',real=' + payload.real.toString() + '\n';
                    receive.write(out);
                    chart.write(out);
                    break; 
                default:
                    break;
            }
        }
        
        var str=receive.getBytes(); //Read the Received string
        
        message_decode(str);
        
        var data = new Uint8Array(str);

        return;
    }
)() 