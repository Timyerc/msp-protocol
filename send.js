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
            MSP_FOURCORNER:       112,
            MSP_BARO_DIFF:        113,
            MSP_WATER_BOX:        114,
            MSP_WIFI_RSSI:        115,
            MSP_WIFI_TEST:        116,
            MSP_FAST_CURRENT:     117,
            MSP_Z_TURN_FAST_CURRENT: 118,
            MSP_SYSTICK:          120,
            MSP_ORIGIN_ARGS:      121,
            MSP_MOTOR_CURRENT:    123,
            MSP_GET_PWMVALUE:     130,
            MSP_GET_USE_FAN_LEVEL_DYNAMIC_COMP: 131,
            MSP_GET_USE_FAN_OUTPUT_PID: 132,
            MSP_GET_MOTOR_VALUE: 133,
            MSP_GET_BOUNDLESS:      134,
            MSP_GET_SPRAY_VALUE:    135,
            MSP_GET_GYRO_THRESHOLD: 136,
            MSP_GET_FAN_PID_PARAM:  140,
            MSP_GET_FAN_PID_RESULT: 142,
            MSP_GET_BATTERY_CHARGE_PARAM: 146,
            MSP_GET_AUTO_TEST_RESULT: 148,
            MSP_GET_REMOTE:         151,
    
            MSP_SET_FAN_PID_PARAM: 141,
            MSP_SET_AUTO_TEST_RESULT: 147,
            MSP_ACC_CALIBRATION:  205,
            MSP_PLAY_VOICE:       208,
            MSP_SET_SPRAY:        209,
            MSP_SET_FAN:          211,
            MSP_SET_MOTOR:        214,
            MSP_SET_TRIGGER:      215,
            MSP_SET_TRIGGER_2:    216,
            MSP_SET_PWMVALUE:     220,
            MSP_SET_USE_FAN_LEVEL_DYNAMIC_COMP: 221,
            MSP_SET_USE_FAN_OUTPUT_PID: 222,
            MSP_SET_MOTOR_VALUE:  223,
            MSP_SET_BOUNDLESS:    224,
            MSP_SET_SPRAY_VALUE:  225,
            MSP_SET_GYRO_THRESHOLD: 226,
            
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
        
        // 输入示例: "MSP_SET_MOTOR Uint16:406 Uint8:100 Int16:-4096 Uint32:10000"
        var input = send.getString().trim();
        var parts = input.split(/\s+/);
    
        var cmdName = parts[0];
        var cmd = codes[cmdName];
    
        if (cmd === undefined) {
            console.log("Unknown command:", cmdName);
            return;
        }
    
        // --- 解析参数 ---
        var typeMap = {
            "Uint8":  { size: 1, writer: "setUint8"  },
            "Int8":   { size: 1, writer: "setInt8"   },
            "Uint16": { size: 2, writer: "setUint16" },
            "Int16":  { size: 2, writer: "setInt16"  },
            "Uint32": { size: 4, writer: "setUint32" },
            "Int32":  { size: 4, writer: "setInt32"  }
        };
    
        var args = [];
        var payloadSize = 0;
    
        for (var i = 1; i < parts.length; i++) {
            var p = parts[i];
            var kv = p.split(":");
    
            if (kv.length !== 2) continue;
    
            var type = kv[0];
            var value = parseInt(kv[1]);
    
            if (!typeMap[type]) continue;
    
            args.push({ type: type, value: value });
            payloadSize += typeMap[type].size;
        }
    
        var totalSize = 6 + payloadSize; // MSP固定头部6字节
        var buf = new Uint8Array(totalSize);
        var dv = new DataView(buf.buffer);
    
        // MSP Header
        buf[0] = 0xFF; // '$'
        buf[1] = 0xFF; // 'M'
        buf[2] = 0x03; // '<'
        buf[3] = cmd;
        buf[4] = payloadSize;
    
        // 填充 payload
        var offset = 5;
        for (var a of args) {
            var info = typeMap[a.type];
            dv[info.writer](offset, a.value, true); // true = little-endian
            offset += info.size;
        }
    
        // checksum = XOR(size, cmd, payload bytes...)
        var checksum =  buf[2] ^ buf[3] ^ buf[4];
        for (var i = 5; i < offset; i++) {
            checksum ^= buf[i];
        }
    
        buf[offset] = checksum;
    
        console.log(buf);
        send.writeBytes(buf);

        return;
    }
)() 