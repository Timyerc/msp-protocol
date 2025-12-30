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
        OSP_HALL:       102,
        OSP_SYSTEM:     109,
        OSP_ANALOG:     110,
        OSP_ADC:        111,
        OSP_FAULT:      112,
        OSP_PID_DATA:   142,
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
          case codes.OSP_HALL:
            payload.hall = view.getInt8(0, 1);
            out = 'hall=' + (payload.hall).toString() + '\n';
            receive.write(out);
            chart.write(out);
            break;
          case codes.OSP_SYSTEM:
            payload.systemPercent = view.getInt16(0, 1);
            payload.task1 = view.getInt32(2, 1);
            payload.task2 = view.getInt32(6, 1);
            out = 'systemPercent=' + (payload.systemPercent).toString() + ',task1=' + (payload.task1).toString() + ',task2=' + (payload.task2).toString() + '\n';
            receive.write(out);
            chart.write(out);
            break;
          case codes.OSP_API_VERSION:
            payload.VER_MOA_MAJOR   = view.getInt8(0, 1);
            payload.VER_MOA_MINOR = view.getInt8(1, 1);
            payload.VER_MOA_PATCH      = view.getInt8(2, 1);
            out = 'VER_MOA_MAJOR=' + (payload.VER_MOA_MAJOR).toString() + ',VER_MOA_MINOR=' + (payload.VER_MOA_MINOR).toString() + ',VER_MOA_PATCH=' + (payload.VER_MOA_PATCH).toString() + '\n';
            receive.write(out);
            chart.write(out);
            break;
          case codes.OSP_ADC:
            payload.sumavg = view.getInt16(0, 1);
            payload.vdc = view.getInt16(2, 1);
            out = 'sumavg=' + (payload.sumavg).toString() + ',vdc=' + (payload.vdc).toString() +'\n';
            receive.write(out);
            chart.write(out);
            break;
        case codes.OSP_FAULT:
            payload.fault = view.getInt8(0, 1);
            out = 'fault=' + (payload.fault).toString() + '\n';
            receive.write(out);
            chart.write(out);
            break;
      case codes.OSP_PID_DATA:
            payload.targetVal = view.getInt32(0, 1);
            payload.actualVal = view.getInt32(4, 1);
            out = 'targetVal=' + (payload.targetVal).toString() + ',actualVal=' + (payload.actualVal).toString() + '\n';
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
      
      // console.log(data);

      //receive.write(str); //Show received string
      //receive.write(str,""Red""); // Shown in red

      return   ;
  }
)() 