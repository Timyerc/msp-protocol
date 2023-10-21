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
            MSP_WATER_BOX:        114,
            MSP_WIFI_RSSI:        115,
            MSP_WIFI_TEST:        116,
            MSP_FAST_CURRENT:     117,
            MSP_Z_TURN_FAST_CURRENT: 118,
            MSP_BARO_DIFF:        119,
            MSP_SYSTICK:          120,
    
            MSP_ACC_CALIBRATION:  205,
            MSP_PLAY_VOICE:       208,
            MSP_SET_SPRAY:        209,
            MSP_SET_FAN:          211,
            MSP_SET_MOTOR:        214,
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
        
        
        
        var str = send.getString();
        var cmd = codes[str];
        
        if (typeof cmd != undefined) {
            var size = 6; // 6 bytes for protocol overhead
            var checksum = 0;
            
            var buffer_out = new ArrayBuffer(size);
            var buf_view = new Uint8Array(buffer_out);    
            
            buf_view[0] = 0xFF; // $
            buf_view[1] = 0xFF; // M
            buf_view[2] = 0x03; // <
            buf_view[3] = cmd; // data length
            buf_view[4] = 0; // code
            
            checksum = buf_view[2] ^ buf_view[3] ^ buf_view[4];
            buf_view[5] = checksum;
            
            console.log(buf_view);
            
            send.writeBytes(buf_view);
        }

        return   ;
    }
)() 