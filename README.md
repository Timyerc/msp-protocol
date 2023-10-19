# MSP Protocol

## 参考

https://github.com/Timyerc/msp-protocol.git

## Command

| 名称 | 值 | 功能 |
| ----------- | ----------- |  ----------- |
| 通用 |
| CMD_PING | 0x01 | 连接测试 |
| CMD_VERSION | 0x02 | 查询版本信息 |
| CMD_BUILD_INFO | 0x05 | 查询编译信息 |
| 读取 |
| MSP_RAW_IMU | 102 | 陀螺仪加速度原始值 |
| MSP_DATA_POINT | 103 | 测试数据点 |
| MSP_GYRO_DETECT | 104 | 陀螺仪撞边判断 |
| MSP_EDGE_BOTTOM_DETECT | 105 | 底边检测 |
| MSP_MACHINE_STATE | 106 | 机器工作状态，水平or竖直 |
| MSP_ATTITUDE | 108 | 机器姿态角 |
| MSP_ANALOG | 110 | AD数据 |
| MSP_ADAPTER | 111 | 适配器电压 |
| MSP_WATER_BOX | 114 | 水量检测 |
| MSP_WIFI_RSSI | 115 | WIFI产测结果 |
| MSP_WIFI_TEST | 116 | WIFI开始产测 |
| MSP_FAST_CURRENT | 117 | 直行电流判断 |
| MSP_Z_TURN_FAST_CURRENT | 118 | Z字水平换行电流 |
| MSP_BARO_DIFF | 119 | 无边气压检测 |
| MSP_SYSTICK | 120 | 系统周期 |
| 设置 |
| MSP_ACC_CALIBRATION | 205 | 加速度校准 |
| MSP_PLAY_VOICE | 208 | 测试语音 |
| MSP_SET_SPRAY | 209 | 控制喷水 |
| MSP_SET_FAN | 211 | 控制风机 |
| MSP_SET_MOTOR | 214 | 控制马达 |
| MSP_SET_TRIGGER | 215 | 发送触发信号 |
