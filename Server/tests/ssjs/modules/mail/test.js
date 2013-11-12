﻿/** This file is part of Wakanda software, licensed by 4D under*  (i) the GNU General Public License version 3 (GNU GPL v3), or*  (ii) the Affero General Public License version 3 (AGPL v3) or*  (iii) a commercial license.* This file remains the exclusive property of 4D and/or its licensors* and is protected by national and international legislations.* In any event, Licensee's compliance with the terms and conditions* of the applicable license constitutes a prerequisite to any use of this file.* Except as otherwise expressly stated in the applicable license,* such license does not include any other license or rights on this file,* 4D's and/or its licensors' trademarks and/or other proprietary rights.* Consequently, no title, copyright or other proprietary rights* other than those specified in the applicable license is granted.*//*** Test suite for the WAF-Mail module.** @author sebastien.courvoisier@4d.com*/// Setup modules on top level (no require() within the test cases):var mailModuleIsAvailable = true;try {	var mail = require('waf-mail/mail');	}catch (e) {	mailModuleIsAvailable = false;}var pop3ModuleIsAvailable = true;try {	var pop = require('waf-mail/POP3');	}catch (e) {	pop3ModuleIsAvailable = false;}var smtpModuleIsAvailable = true;try {	var smtp = require('waf-mail/SMTP');	}catch (e) {	smtpModuleIsAvailable = false;}var lowPop3ModuleIsAvailable = true;try {	var lowPop = require('waf-mail/pop3Client');	}catch (e) {	lowPop3ModuleIsAvailable = false;}var lowSMTPModuleIsAvailable = true;try {	var lowSmtp = require('waf-mail/smtpClient');	}catch (e) {	lowSMTPModuleIsAvailable = false;}var unitTest = require('unitTest');var testCase = {	name: 'Test suite for the WAF-Mail module',			// Empty instances and properties to be used within the test cases:	myMail: null,	myPop: null,	mySmtp: null,	target: null,	login: null,	password: null,	pop: {host: null, port: null},	smtp: {host: null, port: null},	seed: null,	initError: null,	// Ignored tests (waiting for clarifications or implementations):	_should: {		ignore: {		}	},		// Setup test suite:	setUp : function () {        		if (typeof this.initDone === 'undefined') {           			try {				// 0. Do it once:				this.initDone = true;				var envVars = { UTILS_TESTS_PATH: '', WAKANDA_BRANCH: 'WAK6'};				try {					envVars = unitTest.getenv();				}				catch (e) {				}				var accounts = {};				if (os.isWindows) {					var accountsFilePath = envVars.UTILS_TESTS_PATH.replace('\\', '/') + '/../libs/mail-config/accounts.json';				}				else {					var accountsFilePath = envVars.UTILS_TESTS_PATH + '/../libs/mail-config/accounts.json';				}				var accountsFile = File(accountsFilePath);				if (accountsFile.exists !== true) {					this.initError = 'Cannot read the configuration file: ' + accountsFilePath;					throw new Error(this.initError);				}	        			try {	        				accounts = JSON.parse(accountsFile.toString());				}				catch (e) {					this.initError = 'Cannot parse the configuration file: ' + JSON.stringify(e);	            				throw new Error(this.initError);				}								if ((accounts == null) 				|| (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()] === 'undefined')				|| (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].windows === 'undefined')				|| (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].mac === 'undefined')				|| (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].linux === 'undefined')) {					this.initError = 'Configuration file seems wrong: ' + JSON.stringify(accounts);            					throw new Error(this.initError);				}				if (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].target === 'undefined') {					this.target = "default";				}				else {					this.target = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].target;				}				// 1. Init account according to platform:				if (os.isWindows) {					if (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].windows[this.target ] === 'undefined') {						this.initError = 'Target "' + this.target  + '" not found for Windows in configuration file: ' + JSON.stringify(accounts);	            					throw new Error(this.initError);					}					this.login = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].windows[this.target ].login;					this.password = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].windows[this.target ].password;					this.pop = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].windows[this.target ].pop;					this.smtp = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].windows[this.target ].smtp;				}				if (os.isMac) {					if (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].mac[this.target ] === 'undefined') {						this.initError = 'Target "' + this.target  + '" not found for Mac in configuration file: ' + JSON.stringify(accounts);	            					throw new Error(this.initError);					}					this.login = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].mac[this.target ].login;					this.password = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].mac[this.target ].password;					this.pop = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].mac[this.target ].pop;					this.smtp = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].mac[this.target ].smtp;				}				if (os.isLinux) {					if (typeof accounts[envVars.WAKANDA_BRANCH.toLowerCase()].linux[this.target ] === 'undefined') {						this.initError = 'Target "' + this.target  + '" not found for Linux in configuration file: ' + JSON.stringify(accounts);	            					throw new Error(this.initError);					}					this.login = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].linux[this.target ].login;					this.password = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].linux[this.target ].password;					this.pop = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].linux[this.target ].pop;					this.smtp = accounts[envVars.WAKANDA_BRANCH.toLowerCase()].linux[this.target ].smtp;				}			           	            				// 2. Empty dedicated mailbox before the test:				if ((pop3ModuleIsAvailable === true) && (typeof pop === 'object')) {					var emptied = [];					pop.getAllMail(this.pop.host, this.pop.port, true, this.login, this.password, emptied);				}				// 3. Get the timestamp for some later use:				this.seed = new Date().getTime();	        		}	        		catch (e) {	        			if (this.initError === null) this.initError = JSON.stringify(e);				this.initDone = false;			}        		}    	}, 	tearDown : function () {	},	// Init done:		testInitDone: function () {		Y.Assert.areSame(true, this.initDone, this.initError);	},        	// Modules exist:		testMailModuleIsAvailable: function () {		Y.Assert.isTrue(mailModuleIsAvailable);	},		testMailModuleIsObject: function () {		Y.Assert.isObject(mail);	},		testPOP3ModuleIsAvailable: function () {		Y.Assert.isTrue(pop3ModuleIsAvailable);	},		testPOP3ModuleIsObject: function () {		Y.Assert.isObject(pop);	},		testSMTPModuleIsAvailable: function () {		Y.Assert.isTrue(smtpModuleIsAvailable);	},		testSMTPModuleIsObject: function () {		Y.Assert.isObject(smtp);	},		testLowPOP3ModuleIsAvailable: function () {		Y.Assert.isTrue(lowPop3ModuleIsAvailable);	},		testLowPOP3ModuleIsObject: function () {		Y.Assert.isObject(lowPop);	},		testLowSMTPModuleIsAvailable: function () {		Y.Assert.isTrue(lowSMTPModuleIsAvailable);	},		testLowSMTPModuleIsObject: function () {		Y.Assert.isObject(lowSmtp);	},		// Classes methods and properties exist:		testMailConstructorExists: function () {		Y.Assert.isFunction(mail.Mail);	},		testMailCreateMessageModuleMethodExists: function () {		Y.Assert.isFunction(mail.createMessage);	},		testMailSendModuleMethodExists: function () {		Y.Assert.isFunction(mail.send);	},		testPOP3ConstructorExists: function () {		Y.Assert.isFunction(pop.POP3);	},	testPOP3CreateClientModuleMethodExists: function () {		Y.Assert.isFunction(pop.createClient);	},		testPOP3GetAllMailModuleMethodExists: function () {		Y.Assert.isFunction(pop.getAllMail);	},		testPOP3GetAllMailAndDeleteModuleMethodExists: function () {		Y.Assert.isFunction(pop.getAllMailAndDelete);	},		testSMTPConstructorExists: function () {		Y.Assert.isFunction(smtp.SMTP);	},		testSMTPCreateClientModuleMethodExists: function () {		Y.Assert.isFunction(smtp.createClient);	},		testSMTPSendModuleMethodExists: function () {		Y.Assert.isFunction(smtp.send);	},		// Instances methods and properties exist:		testMailInstanceIsObject: function () {		Y.Assert.isNull(this.myMail);		this.myMail = new mail.Mail();		Y.Assert.isObject(this.myMail);	},		testMailInstanceBccAttributeIsEmpty: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isUndefined(this.myMail.bcc, 'BCC should be undefined');	},		testMailInstanceCcAttributeIsEmpty: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isUndefined(this.myMail.cc, 'CC should be undefined');	},		testMailInstanceFromAttributeIsEmpty: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isUndefined(this.myMail.from, 'From should be undefined');	},		testMailInstanceSubjectAttributeIsEmpty: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isUndefined(this.myMail.subject, 'Subject should be undefined');	},		testMailInstanceToAttributeIsEmpty: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isUndefined(this.myMail.to, 'To should be undefined');	},		testMailInstanceAddAttachmentMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.addAttachment);	},		testMailInstanceAddFieldMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.addField);	},		testMailInstanceGetBodyMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.getBody);	},		testMailInstanceGetBodyTypeMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.getBodyType);	},		testMailInstanceGetContentMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.getContent);	},		testMailInstanceGetFieldMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.getField);	},		testMailInstanceGetHeaderMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.getHeader);	},		testMailInstanceGetMessagePartsMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.getMessageParts);	},		testMailInstanceIsMIMEMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.isMIME);	},		testMailInstanceParseMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.parse);	},		testMailInstanceRemoveFieldMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.removeField);	},		testMailInstanceSendMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.send);	},		testMailInstanceSetBodyMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.setBody);	},		testMailInstanceSetBodyAsHTMLMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.setBodyAsHTML);	},		testMailInstanceSetBodyTypeMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.setBodyType);	},		testMailInstanceSetBodyTypeToHTMLMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.setBodyTypeToHTML);	},		testMailInstanceSetContentMethodExists: function () {		Y.Assert.isObject(this.myMail);		Y.Assert.isFunction(this.myMail.setContent);	},		testPOP3InstanceIsObject: function () {		Y.Assert.isNull(this.myPop);		this.myPop = new pop.POP3();		Y.Assert.isObject(this.myPop);	},		testPOP3InstanceAuthenticateMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.authenticate);	},	testPOP3InstanceClearDeletionMarksMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.clearDeletionMarks);	},	testPOP3InstanceConnectMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.connect);	},		testPOP3InstanceGetAllMessageSizesMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.getAllMessageSizes);	},	testPOP3InstanceGetMessageSizeMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.getMessageSize);	},	testPOP3InstanceGetStatusMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.getStatus);	},	testPOP3InstanceMarkForDeletionMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.markForDeletion);	},	testPOP3InstanceQuitMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.quit);	},	testPOP3InstanceRetrieveMessageMethodExists: function () {		Y.Assert.isObject(this.myPop);		Y.Assert.isFunction(this.myPop.retrieveMessage);	},	testSMTPInstanceIsObject: function () {		Y.Assert.isNull(this.mySmtp);		this.mySmtp = new smtp.SMTP();		Y.Assert.isObject(this.mySmtp);	},		testSMTPInstanceAuthenticateMethodExists: function () {		Y.Assert.isObject(this.mySmtp);		Y.Assert.isFunction(this.mySmtp.authenticate);	},	testSMTPInstanceConnectMethodExists: function () {		Y.Assert.isObject(this.mySmtp);		Y.Assert.isFunction(this.mySmtp.connect);	},	testSMTPInstanceQuitMethodExists: function () {		Y.Assert.isObject(this.mySmtp);		Y.Assert.isFunction(this.mySmtp.quit);	},	testSMTPInstanceSendMethodExists: function () {		Y.Assert.isObject(this.mySmtp);		Y.Assert.isFunction(this.mySmtp.send);	},	testSMTPInstanceStarttlsMethodExists: function () {		Y.Assert.isObject(this.mySmtp);		Y.Assert.isFunction(this.mySmtp.starttls);	},	// Modules business logic:	test1MailboxIsEmpty: function () {		// First, make sure that the mailbox is empty after the first getAllMail() from the Setup:		Y.Assert.isTrue(pop3ModuleIsAvailable);		Y.Assert.isObject(pop);		var emails = [];		var done = pop.getAllMail(this.pop.host, this.pop.port, true, this.login, this.password, emails);		Y.Assert.isTrue(done);		Y.ArrayAssert.itemsAreSimilar([], emails);	},	test2ComposeSimpleEmail: function () {		// @todo: addField String, String		Y.Assert.isTrue(mailModuleIsAvailable);		Y.Assert.isObject(this.myMail);		this.myMail = new mail.Mail();		this.myMail.from = this.login;		this.myMail.to = this.login;		this.myMail.subject = 'First Simple Test Subject ' + this.seed;		this.myMail.setBody('First Simple Test Body ' + this.seed);		Y.ArrayAssert.itemsAreSimilar([this.login, this.login], [this.myMail.from, this.myMail.getField('from')]);		Y.ArrayAssert.itemsAreSimilar([this.login, this.login], [this.myMail.to, this.myMail.getField('to')]);		Y.ArrayAssert.itemsAreSimilar(['First Simple Test Subject ' + this.seed, 'First Simple Test Subject ' + this.seed], [this.myMail.subject, this.myMail.getField('subject')]);		Y.ArrayAssert.itemsAreSimilar(['First Simple Test Body ' + this.seed], this.myMail.getBody());		Y.Assert.areSame('text/plain', this.myMail.getBodyType());	},	test3SendSimpleEmail: function () {		Y.Assert.isTrue(mailModuleIsAvailable);		Y.Assert.isObject(this.myMail);		var done = null;		done = this.myMail.send(this.smtp.host, this.smtp.port, true, this.login, this.password);		unitTest.log('test3SendSimpleEmail Done:');		unitTest.log(done);		Y.Assert.isObject(done);		Y.Assert.isTrue(done.isOk);		Y.Assert.areSame(0, done.action);		Y.Assert.isObject(done.smtp);	},	test4GetSimpleEmail: function () {		Y.Assert.isTrue(pop3ModuleIsAvailable);		Y.Assert.isObject(pop);		var iter = 0;		var done = false;		var emails = [];		var stillWaiting = true;		do {			wait(60000);			done = pop.getAllMail(this.pop.host, this.pop.port, true, this.login, this.password, emails);			unitTest.log('test4GetSimpleEmail iter: ' + iter + ' - ' + emails.length + ' - Done:');			unitTest.log(done);			if ((iter++ > 10) || ((done === true) && (emails.length > 0))) stillWaiting = false;		} while (stillWaiting);				Y.Assert.isTrue(done);		Y.Assert.isArray(emails);		Y.Assert.areSame(1, emails.length);		Y.Assert.isObject(emails[0]);		Y.Assert.isFunction(emails[0].isMIME);		Y.Assert.isFalse(emails[0].isMIME());		Y.Assert.areSame(this.login, emails[0].From, 'Wrong From');		Y.Assert.areSame(this.login, emails[0].getField('To'), 'Wrong To');		Y.Assert.areSame('First Simple Test Subject ' + this.seed, emails[0].Subject);		Y.Assert.areSame('text/plain', emails[0].getBodyType());		Y.Assert.areSame('First Simple Test Body ' + this.seed, emails[0].getBody().toString());	}};