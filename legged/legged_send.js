(
    function main() {
        var codes = {
            BALANCE_READ_ALL:           100,
            BALANCE_KP:                 101,
            BALANCE_KI:                 102,
            BALANCE_KD:                 103,
            BALANCE_SPEED_KP:           104,
            BALANCE_SPEED_KI:           105,
            BALANCE_SPEED_KD:           106,
            BALANCE_TARGET_TILT_LIMIT:  107,
            BALANCE_TORQUE_DEADBAND:    108,
            BALANCE_ANGLE_DEADBAND:     109,
            
            BALANCE_WAVEFORM:           110,
            BALANCE_CUSTOM1:            111,
            BALANCE_CUSTOM2:            112,
            BALANCE_CUSTOM3:            113,
            BALANCE_CUSTOM4:            114,
            BALANCE_CUSTOM5:            115,
            BALANCE_CUSTOM6:            116,
            BALANCE_CUSTOM7:            117,
            BALANCE_CUSTOM8:            118,
            BALANCE_CUSTOM9:            119,
        };
        
        // 将浮点数转换为4字节的ArrayBuffer（IEEE 754 单精度）
        function floatToBytes(value) {
            var buffer = new ArrayBuffer(4);
            var view = new DataView(buffer);
            view.setFloat32(0, value, true); // 小端模式
            return new Uint8Array(buffer);
        }

        var str = send.getString();
        var words = str.split(","); // 按逗号分隔
        for (var i = 0; i < words.length; i++) {
            var word = words[i].split(":"); // 按分号分隔
            var cmd = codes[word[0]];
            
            if (typeof cmd == "undefined") continue; // 命令不存在则跳过
            
            var valueBytes = null;
            var dataLen = 0;
            var valueRaw = word[1];
            
            if (cmd == codes.BALANCE_WAVEFORM) {
                // WAVEFORM 使用枚举值（整数）
                var intVal = codes[valueRaw] || 0;
                valueBytes = new Uint8Array(4);
                valueBytes[0] = intVal & 0xFF;
                valueBytes[1] = (intVal >> 8) & 0xFF;
                valueBytes[2] = (intVal >> 16) & 0xFF;
                valueBytes[3] = (intVal >> 24) & 0xFF;
                dataLen = 4;
            } else if (valueRaw.indexOf(".") !== -1 || !isNaN(parseFloat(valueRaw)) && !isNaN(parseInt(valueRaw))) {
                // 判断是否为浮点数（包含小数点）或可被解析为数字
                var floatVal = parseFloat(valueRaw);
                if (!isNaN(floatVal)) {
                    valueBytes = floatToBytes(floatVal);
                    dataLen = 4;
                } else {
                    console.log("无效的数字: " + valueRaw);
                    continue;
                }
            } else {
                // 整数处理
                var intVal = parseInt(valueRaw);
                if (!isNaN(intVal)) {
                    valueBytes = new Uint8Array(4);
                    valueBytes[0] = intVal & 0xFF;
                    valueBytes[1] = (intVal >> 8) & 0xFF;
                    valueBytes[2] = (intVal >> 16) & 0xFF;
                    valueBytes[3] = (intVal >> 24) & 0xFF;
                    dataLen = 4;
                } else {
                    console.log("无法解析的值: " + valueRaw);
                    continue;
                }
            }

            var buffer_out = new ArrayBuffer(10);
            var buf_view = new Uint8Array(buffer_out);
            buf_view[0] = 0xFF; // 帧头
            buf_view[1] = 0xFF; // 帧头
            buf_view[2] = 0x03; // 返回
            buf_view[3] = cmd;  // 命令码（直接放命令码）
            buf_view[4] = 0x04; // 数据长度（4字节）
            buf_view[5] = valueBytes[0];
            buf_view[6] = valueBytes[1];
            buf_view[7] = valueBytes[2];
            buf_view[8] = valueBytes[3];
            // 校验和异或从 buf_view[2] 到 buf_view[8]
            buf_view[9] = buf_view[2] ^ buf_view[3] ^ buf_view[4] ^ buf_view[5] ^ buf_view[6] ^ buf_view[7] ^ buf_view[8];
                        
            console.log("发送命令:", word[0], "值:", valueRaw, "字节:", buf_view);
            send.writeBytes(buf_view);
        }
        return;
    }
)()