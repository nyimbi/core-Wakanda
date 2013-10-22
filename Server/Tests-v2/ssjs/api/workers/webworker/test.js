/*
* This file is part of Wakanda software, licensed by 4D under
*  (i) the GNU General Public License version 3 (GNU GPL v3), or
*  (ii) the Affero General Public License version 3 (AGPL v3) or
*  (iii) a commercial license.
* This file remains the exclusive property of 4D and/or its licensors
* and is protected by national and international legislations.
* In any event, Licensee's compliance with the terms and conditions
* of the applicable license constitutes a prerequisite to any use of this file.
* Except as otherwise expressly stated in the applicable license,
* such license does not include any other license or rights on this file,
* 4D's and/or its licensors' trademarks and/or other proprietary rights.
* Consequently, no title, copyright or other proprietary rights
* other than those specified in the applicable license is granted.
*/
// isObject() is used instead of isFunction().
// Native (C++) functions are unsupported by isFunction().
var testCase = {
    name: "Web Workers Test",
    _should: {
        ignore: {
        }
    },
    testIsDedicatedWorkerAvailable: function() {
        Y.Assert.isObject(Worker);
    },
    // Check WorkerGlobalScope attributes and function.
    testWorkerGlobalScope: function() {
        Y.Assert.isObject(self);
        Y.Assert.isObject(close);
    },
    // Check dedicated worker constructor.
    testDedicatedWorkerContructor: function() {
        var myDedicatedWorker = new Worker('doNothingWorker.js');
        Y.Assert.isObject(myDedicatedWorker);
    // Check dedicated worker proxy object.
    testDedicatedWorkerProxyObject: function() {
        var myDedicatedWorker = new Worker('doNothingWorker.js');
        // onerror and onmessage are user defined attributes.
        Y.Assert.isObject(myDedicatedWorker.terminate);         
    },
    // Check message exchange between a parent and a child dedicated worker.
        var myDedicatedWorker   = new Worker('pingPongDedicatedWorker.js');
        myDedicatedWorker.onmessage = function(event) {
            test.resume(function() {
                Y.Assert.areEqual("test", event.data);
            });
        }
        myDedicatedWorker.postMessage("test");
    },
    // Check DedicatedWorkerGlobalScope attributes and function.
        var myDedicatedWorker   = new Worker('globalScopeDedicatedWorker.js');
        myDedicatedWorker.onmessage = function(event) {
            test.resume(function() {
                Y.Assert.isTrue(event.data.self);
            });
        }
        this.wait(1000);
    },
    // Check error reporting from dedicated worker.
    testDedicatedWorkerErrorReporting: function() {
		var	hasException;
		
		// Try to run a non existing script.

		hasException = false;
		try {
		
			new Worker('noSuchFile.js');	
			
		} catch (exception) {
		
			hasException = true;
		
		}
        Y.Assert.isTrue(hasException);
		
		// Try to run a script with syntax error.
		
		hasException = false;
		try {
		
			new Worker('syntaxError.js');
			
		} catch (exception) {
		
			hasException = true;
		
		}
    // Check that it is possible to create dedicated workers recursively.
    testRecursiveDedicatedWorkers: function() {
        var myDedicatedWorker   = new Worker('recursiveDedicatedWorker.js');
        myDedicatedWorker.onerror = function(event) {
		
            Y.Assert.isObject(event);
            Y.Assert.isString(event.message);
            Y.Assert.isString(event.filename);
            Y.Assert.isNumber(event.lineno);
			Y.Assert.isObject(event.initErrorEvent);
		
            // Thrown exception, not possible to create dedicated workers recursively.
            webWorkersTest._should.ignore.testDedicatedWorkerErrorPropagation = true;
            test.resume(function() { Y.Assert.isTrue(false); });
        }
        myDedicatedWorker.onmessage = function(event) {
            // Ok, worker has been created.        
            test.resume(function() { Y.Assert.areEqual(event.data, "Ok."); });
        }
        this.wait(4000);
    // Check that error are propagated: Create a dedicated worker which will also invoke an erroneous dedicated worker.
    testDedicatedWorkerErrorPropagation: function() {
        var myDedicatedWorker   = new Worker('errorPropagatorDedicatedWorker.js');
        myDedicatedWorker.onerror = function(event) {
            // Error has been propagated.
            test.resume(function() { });
        }
    // If a "child" dedicated worker handles an error, it is not to be propagated to its "parent".
    testDedicatedWorkerErrorCatching: function() {
        var myDedicatedWorker   = new Worker('errorCatcherDedicatedWorker.js');
        myDedicatedWorker.onerror = function(event) {
            // Error has been propagated.
        this.wait(function() {
            Y.Assert.isTrue(!hasPropagated);
    }
    // Check if SharedWorker() constructor is available.
    testIsSharedWorkerAvailable: function() {
        Y.Assert.isObject(SharedWorker);
    // Check shared worker constructor.
    testSharedWorkerContructor: function() {
    // Check shared worker proxy object.
    testSharedWorkerProxyObject: function() {
        // onerror and port.onmessage are user defined attributes.
    },
    // Check message exchange between with a shared worker.
    testSharedWorkerMessaging: function() {
        var mySharedWorker  = new SharedWorker("pingPongSharedWorker.js");
        mySharedWorker.port.onmessage = function(event) {
                Y.Assert.areEqual("test", event.data);
            });
        }
        mySharedWorker.port.postMessage("test");
        this.wait(1000);
    
    }

};
