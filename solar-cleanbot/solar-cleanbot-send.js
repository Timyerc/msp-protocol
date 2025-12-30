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
            CMD_RANGEFINDER: 97,
            CMD_SET_ROTATE: 99,
            CMD_SET_LINE_STATUS: 101,
            CMD_RAW_IMU: 102,
            CMD_GET_LINE_STATUS: 103,
            CMD_MOTOR_SPEED: 104,
            CMD_CROSS_BATT: 105,
            CMD_GET_EDGE_LINE_STATUS: 106,
            CMD_ATTITUDE: 108,
            CMD_SYSTEM: 109,
            CMD_GET_REVEIVER: 110,
            CMD_FRAMERATE: 111,
            CMD_MOTOR_STATUS: 112,
            CMD_BATTERY_STATE: 130,
            CMD_DATA_POINT: 131,
            CMD_GET_TEMP: 132,
            CMD_GET_MOVE_STATUS: 133,
            CMD_SET_ACC_CALIBRATION: 136,
            CMD_SET_MOTOR_CURRENTHOLD: 143,
            CMD_GET_MOTOR_CURRENTHOLD: 144,
            CMD_SET_PID_INFO: 150,
            CMD_SET_DRIVE_MOTOR: 151,
            CMD_SET_BRUSH_MOTOR: 152,
            CMD_TEST_ODRIVE_IBUS: 170,
        };
        
        var str = send.getString();
        var words = str.split(" "); // 按空格分隔
        console.log(words)
        var cmd = codes[words[0]];
        var dataLen = 0;
        
        if (words.length > 1) {
            var dataLen = (words.length - 1);
        }
        
        if (typeof cmd != undefined) {
            var size = 6 + dataLen; // 6 bytes for protocol overhead
            var checksum = 0;
            
            var buffer_out = new ArrayBuffer(size);
            var buf_view = new Uint8Array(buffer_out);
            
            buf_view[0] = 0xFF; // $
            buf_view[1] = 0xFF; // M
            buf_view[2] = 0x03; // <
            buf_view[3] = cmd; // command
            buf_view[4] = dataLen; // data length
            
            checksum = buf_view[2] ^ buf_view[3] ^ buf_view[4];
            
            for (var i = 0; i < dataLen / 2; i++) {
                buf_view[5 + i * 2] = (words[i * 2 + 2] >> 8) & 0xFF;
                checksum ^= buf_view[5 + i * 2];
                buf_view[6 + i * 2] = words[i * 2 + 2] & 0xFF;
                checksum ^= buf_view[6 + i * 2];
            }
            
            buf_view[dataLen + 5] = checksum;
            
            console.log(buf_view);
            
            send.writeBytes(buf_view);
        }
        
        return;
    }
)()
