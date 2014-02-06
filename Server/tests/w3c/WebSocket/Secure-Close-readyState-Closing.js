﻿        var test = async_test("W3C WebSocket API - Create Secure WebSocket - Close the Connection - readyState should be in CLOSING state just before onclose is called");

        var wsocket = CreateWebSocket(true, false, false);
        var isOpenCalled = false;

        wsocket.addEventListener('open', test.step_func(function (evt) {
            wsocket.close();
            assert_equals(wsocket.readyState, 2, "readyState should be 2(CLOSING)");
            clearTimeout(timeOut);
            test.done();
        }), true);