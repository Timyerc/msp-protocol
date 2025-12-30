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
          OSP_ver:    1,
          OSP_HALL:       102,
          OSP_SYSTEM:     109,
          OSP_ANALOG:     110,
          OSP_ADC:        111,
          OSP_FAULT:      112,
          OSP_SET_PID:    141,
          OSP_PID_DATA:   142,
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
            buf_view[2] = 0x05; // <
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