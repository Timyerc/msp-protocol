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
          
          MSP_BARO_DIFF:        119,  
          
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