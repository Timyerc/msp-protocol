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
        READ:           0,
        ODRV_VBAT:      101,
        ODRV_IBUS:      102,
        ODRV_HALL:      103,
        ODRV_TEMP:      104,
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
          case codes.ODRV_IBUS:
            payload.ibus = view.getInt16(0, 1);
            payload.m0_ibus = view.getInt16(2, 1);
            payload.m1_ibus = view.getInt16(4, 1);
            out = 'ibus=' + (payload.ibus).toString() + ',m0_ibus=' + (payload.m0_ibus).toString() + ',m1_ibus=' + (payload.m1_ibus).toString() + '\n';
            receive.write(out);
            chart.write(out);
            break;
          case codes.ODRV_VBAT:
            payload.vbat = view.getInt16(0, 1);
            payload.m0_speed = view.getInt16(2, 1);
            payload.m1_speed = view.getInt16(4, 1);
            out = 'vbat=' + (payload.vbat).toString() + ',m0_speed=' + (payload.m0_speed).toString() + ',m1_speed=' + (payload.m1_speed).toString() + '\n';
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