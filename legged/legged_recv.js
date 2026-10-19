/********************************
 * 串口助手接收解析脚本
 * 支持解析单精度浮点数（4字节，小端模式）
 * 
 * 协议格式：
 * FF FF [剩余长度] [命令码] [数据长度] [数据...] [校验和]
 *******************************/

(
    function main() {
        var codes = {
            BALANCE_WAVEFORM:           100,
            BALANCE_KP:                 101,
            BALANCE_KI:                 102,
            BALANCE_KD:                 103,
            BALANCE_SPEED_KP:           104,
            BALANCE_SPEED_KI:           105,
            BALANCE_SPEED_KD:           106,
            BALANCE_TARGET_TILT_LIMIT:  107,
            BALANCE_TORQUE_DEADBAND:    108,
            BALANCE_ANGLE_DEADBAND:     109,
            
            BALANCE_CUSTOM0:            110,
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
        
        code_to_name = {};

        for (var key in codes) {
            var value = codes[key];
            code_to_name[value] = key + "";
        }
        
        /**
         * 从 DataView 中读取小端单精度浮点数
         * @param {DataView} view - DataView对象
         * @param {number} offset - 偏移量（字节）
         * @returns {number} 浮点数值
         */
        function readFloat32(view, offset) {
            return view.getFloat32(offset, true); // true表示小端模式
        }
        
        /**
         * 从 DataView 中读取小端16位整数
         * @param {DataView} view - DataView对象
         * @param {number} offset - 偏移量（字节）
         * @returns {number} 整数值
         */
        function readInt16(view, offset) {
            return view.getInt16(offset, true);
        }
        
        var message_decode = function (data) {
            var data = new Uint8Array(data);
            console.log("原始数据:", Array.from(data).map(b => '0x' + b.toString(16).padStart(2,'0')).join(' '));
            
            if (typeof message_state == 'undefined') {
                message_state = 0;
            }
            
            if (typeof message_length_received == 'undefined') {
                message_length_received = 0;
            }
        
            for (var i = 0; i < data.length; i++) {
                switch (message_state) {
                    case 0: // sync char 1
                        if (data[i] == 0xFF) {
                            message_state++;
                        }
                        break;
                    case 1: // sync char 2
                        if (data[i] == 0xFF) {
                            message_state++;
                        } else {
                            message_state = 0; // restart and try again
                        }
                        break;
                    case 2: // 剩余长度（从命令码到校验前的字节数）
                        message_remaining_length = data[i];
                        message_checksum = data[i];
                        message_state++;
                        break;
                    case 3: // 命令码
                        message_code = data[i];
                        message_checksum ^= data[i];
                        message_state++;
                        break;
                    case 4: // 数据长度
                        message_data_length = data[i];
                        message_checksum ^= data[i];
                        message_buffer = new ArrayBuffer(message_data_length);
                        message_buffer_uint8_view = new Uint8Array(message_buffer);
                        
                        if (message_data_length != 0) {
                            message_state++;
                        } else {
                            message_state += 2; // 无数据，直接跳到校验
                        }
                        break;
                    case 5: // data / payload
                        message_buffer_uint8_view[message_length_received] = data[i];
                        message_checksum ^= data[i];
                        message_length_received++;

                        if (message_length_received >= message_data_length) {
                            message_state++;
                        }
                        break;
                    case 6: // 校验和
                        if (message_checksum == data[i]) {
                            // 校验成功，处理数据
                            var name = code_to_name[message_code];
                            console.log("收到命令:", name, "代码:", message_code);
                            message_decode_payload(message_code, message_buffer, message_data_length);
                        } else {
                            console.log("校验失败! 计算值:", message_checksum, "接收值:", data[i]);
                        }
                        // 重置变量
                        message_length_received = 0;
                        message_state = 0;           
                        break;
                }
            }
        };
        
        var message_decode_payload = function (msp_code, data, data_length) {
            var view = new DataView(data, 0);
            var out = "";
            var param_name = "";
            
            // 用于存储解析结果
            var result = {};
            
            switch (msp_code) {
                case codes.BALANCE_WAVEFORM:
                    // 波形数据：6个浮点数
                    if (data_length >= 24) { // 6 * 4 = 24字节
                        result.recv0 = readFloat32(view, 0);
                        result.recv1 = readFloat32(view, 4);
                        result.recv2 = readFloat32(view, 8);
                        result.recv3 = readFloat32(view, 12);
                        result.recv4 = readFloat32(view, 16);
                        result.recv5 = readFloat32(view, 20);
                        out = 'recv0=' + result.recv0.toFixed(4) + 
                              ',recv1=' + result.recv1.toFixed(4) + 
                              ',recv2=' + result.recv2.toFixed(4) + 
                              ',recv3=' + result.recv3.toFixed(4) + 
                              ',recv4=' + result.recv4.toFixed(4) + 
                              ',recv5=' + result.recv5.toFixed(4) + '\n';
                    } else {
                        out = "波形数据长度错误: " + data_length + "\n";
                    }
                    break;
                    
                case codes.BALANCE_KP:
                    // 回传两个浮点数：旧值和新值
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_KP: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                        param_name = "kp";
                    } else if (data_length >= 4) {
                        // 兼容单值返回
                        result.kp = readFloat32(view, 0);
                        out = 'kp=' + result.kp.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_KI:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_KI: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.ki = readFloat32(view, 0);
                        out = 'ki=' + result.ki.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_KD:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_KD: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.kd = readFloat32(view, 0);
                        out = 'kd=' + result.kd.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_SPEED_KP:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_SPEED_KP: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.speed_kp = readFloat32(view, 0);
                        out = 'speed_kp=' + result.speed_kp.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_SPEED_KI:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_SPEED_KI: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.speed_ki = readFloat32(view, 0);
                        out = 'speed_ki=' + result.speed_ki.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_SPEED_KD:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_SPEED_KD: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.speed_kd = readFloat32(view, 0);
                        out = 'speed_kd=' + result.speed_kd.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_TARGET_TILT_LIMIT:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_TARGET_TILT_LIMIT: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.target_tilt_limit = readFloat32(view, 0);
                        out = 'target_tilt_limit=' + result.target_tilt_limit.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_TORQUE_DEADBAND:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_TORQUE_DEADBAND: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.torque_deadband = readFloat32(view, 0);
                        out = 'torque_deadband=' + result.torque_deadband.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_ANGLE_DEADBAND:
                    if (data_length >= 8) {
                        result.old_value = readFloat32(view, 0);
                        result.new_value = readFloat32(view, 4);
                        out = 'BALANCE_ANGLE_DEADBAND: 原值=' + result.old_value.toFixed(4) + 
                              ', 新值=' + result.new_value.toFixed(4) + '\n';
                    } else if (data_length >= 4) {
                        result.angle_deadband = readFloat32(view, 0);
                        out = 'angle_deadband=' + result.angle_deadband.toFixed(4) + '\n';
                    }
                    break;
                    
                case codes.BALANCE_READ_ALL:
                    // 读取所有参数：9个浮点数
                    if (data_length >= 36) { // 9 * 4 = 36字节
                        result.kp = readFloat32(view, 0);
                        result.ki = readFloat32(view, 4);
                        result.kd = readFloat32(view, 8);
                        result.speed_kp = readFloat32(view, 12);
                        result.speed_ki = readFloat32(view, 16);
                        result.speed_kd = readFloat32(view, 20);
                        result.target_tilt_limit = readFloat32(view, 24);
                        result.torque_deadband = readFloat32(view, 28);
                        result.angle_deadband = readFloat32(view, 32);
                        
                        out = '=== 平衡参数 ===\n' +
                              'kp=' + result.kp.toFixed(4) + '\n' +
                              'ki=' + result.ki.toFixed(4) + '\n' +
                              'kd=' + result.kd.toFixed(4) + '\n' +
                              'speed_kp=' + result.speed_kp.toFixed(4) + '\n' +
                              'speed_ki=' + result.speed_ki.toFixed(4) + '\n' +
                              'speed_kd=' + result.speed_kd.toFixed(4) + '\n' +
                              'target_tilt_limit=' + result.target_tilt_limit.toFixed(4) + '\n' +
                              'torque_deadband=' + result.torque_deadband.toFixed(4) + '\n' +
                              'angle_deadband=' + result.angle_deadband.toFixed(4) + '\n';
                    } else {
                        out = "读取所有参数数据长度错误: " + data_length + "\n";
                    }
                    break;
                    
                default:
                    // 处理自定义参数（CUSTOM0-CUSTOM9）
                    if (msp_code >= codes.BALANCE_CUSTOM0 && msp_code <= codes.BALANCE_CUSTOM9) {
                        if (data_length >= 4) {
                            var custom_value = readFloat32(view, 0);
                            var custom_name = code_to_name[msp_code];
                            out = custom_name + '=' + custom_value.toFixed(4) + '\n';
                        }
                    } else {
                        out = "未知命令码: " + msp_code + "\n";
                    }
                    break;
            }
            
            if (out) {
                console.log(out);
                receive.write(out);
                if (typeof chart !== 'undefined') {
                    chart.write(out);
                }
            }
        }
        
        // 主入口：读取接收到的数据并解析
        var str = receive.getBytes();
        if (str && str.length > 0) {
            message_decode(str);
        }
        
        return;
    }
)()