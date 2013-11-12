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

include('./script/md5.js');
var admin = require("admin");
/* 
 * Generate a token which will be used by the studio in url to open admintration page   
 * in a browser. 
 * The goal is to avoid repeated authentication if it was already done in studio. 
 * more info at: https://project.wakanda.org/issues/5302  
 */
exports.getAuthenticationToken = function getAthenticationToken(name, pass) {
    var tokens, key;
    tokens = storage.getItem("tokens");
    if (tokens === null) {
        tokens = [];
    }
    key = directory.computeHA1(name, pass);
    tokens[key] = {
        name: name,
        pass: pass
    };
    if (storage.tryLock()) {
        storage.setItem("tokens", tokens);
        storage.unlock();
    }
    return key;
};
exports.getSolutionInfo = function getSolutionInfo(hash) {
    var k, i, kLen, iLen, sol, app, apps, dataFile, solutions, folderlog, rpcService, webAppService, recentSolution, recentSolutions, dataStoreService, logFilePathHash;
    solutions = [];
    logFilePathHash = [];
    recentSolutions = [];
    var _solution = storage.recentSolutions;
    if (_solution.hasOwnProperty(hash)) {
        recentSolutions.push(_solution[hash]);
    }
    if (recentSolutions !== null && typeof recentSolutions !== 'undefined') {
        for (k = 0, kLen = recentSolutions.length; k < kLen; k++) {
            if (recentSolutions[k].path.indexOf("/Default Solution/DefaultSolution.waSolution") !== -1) { //don't return default solution details
                continue;
            }
            if (File(recentSolutions[k].path).exists === false) {
                continue;
            }
            try 
            {
                recentSolution = recentSolutions[k];
                if (recentSolution.path !== solution.getFolder('path') + solution.name + ".waSolution") {
                    recentSolution = internal.openSolution(recentSolutions[k].path, 2);
                } else {
                    recentSolution = solution;
                } if (recentSolution !== null) {
                    sol = {};
                    sol.name = recentSolution.name;
                    sol.hash = hex_md5(recentSolution.getFolder('path'));
                    sol.apps = [];
                    sol.path = recentSolution.getFolder('path') + sol.name + ".waSolution";
                    sol.isRunning = (sol.path === solution.getFolder('path') + sol.name + ".waSolution");
                    sol.isProtected = directory.hasAdministrator();
                    sol.settings = getSettingsFromSolution(recentSolution);
                    for (i = 0, iLen = recentSolution.applications.length; i < iLen; i++) {
                        apps = recentSolution.applications[i];
                        if (apps.name === "ServerAdmin") {
                            continue;
                        }
                        app = {};
                        app.name = apps.name;
                        app.path = apps.getFolder('path');
                        app.admin = apps.administrator;
                        app.pattern = apps.pattern;
                        if ((apps.getItemsWithRole("catalog") !== null) && (typeof apps.getItemsWithRole("catalog") !== 'undefined')) {
                            app.waModel = apps.getItemsWithRole("catalog").path;
                        } else {
                            app.waModel = "";
                        }
                        dataFile = getModelData(apps);
                        if ((dataFile !== null) && (typeof dataFile !== 'undefined')) {
                            app.waData = dataFile.path;
                        } else {
                            app.waData = "";
                            app.waDatashort = "";
                            app.files = [];
                        } // log
                        app.files = {
                            "verify": [],
                            "repair": [],
                            "compact": [],
                            "backup": [],
                            "unknown": []
                        };
                        folderlog = Folder(app.path + 'Logs');
                        folderlog.forEachFile(function(file) {
                            var hash, fileObject = {};
                            fileObject.name = file.name;
                            fileObject.formatedDate = formatDate(file.creationDate);
                            fileObject.date = '' + file.creationDate.getTime();
                            fileObject.path = file.path;
                            hash = hex_md5(file.path);
                            logFilePathHash[hash] = file.path;
                            fileObject.hash = hash;
                            if (file.name.substr(0, 6) === "verify") {
                                app.files.verify.push(fileObject);
                            } else if (file.name.substr(0, 6) === "repair") {
                                app.files.repair.push(fileObject);
                            } else if (file.name.substr(0, 7) === "compact") {
                                app.files.compact.push(fileObject);
                            } else if (file.name.substr(0, 6) === "backup") {
                                app.files.backup.push(fileObject);
                            } else {
                                app.files.unknown.push(fileObject);
                            }
                        }); // end log
                        app.http = {
                            ip: apps.httpServer.ipAddress,
                            port: apps.httpServer.port,
                            sslPort: apps.httpServer.ssl.port,
                            enabled: apps.httpServer.started,
                            hostName: apps.httpServer.hostName
                        };
                        app.webApp = {
                            enabled: false,
                            directoryIndex: ''
                        };
                        webAppService = require('services/webApp').getInstanceFor(apps);
                        if ((webAppService !== null) && (typeof webAppService !== 'undefined')) {
                            app.webApp.enabled = webAppService.isStarted();
                            app.webApp.directoryIndex = apps.settings.getItem('services')['webApp'].directoryIndex;
                        }
                        app.dataService = {
                            enabled: false
                        };
                        dataStoreService = require('services/dataStore').getInstanceFor(apps);
                        if ((dataStoreService !== null) && (typeof dataStoreService !== 'undefined')) {
                            app.dataService.enabled = dataStoreService.isStarted();
                        }
                        app.rpcService = {
                            enabled: false
                        };
                        rpcService = require('services/rpc').getInstanceFor(apps);
                        if ((rpcService !== null) && (typeof rpcService !== 'undefined')) {
                            app.rpcService.enabled = rpcService.isStarted();
                        }
                        app.fileService = {
                            enabled: false
                        };
                        sol.apps.push(app);
                    }
                }
                solutions.push(sol);
            } catch (e) 
            {
                continue;
            } finally {
                if (recentSolution !== null && typeof recentSolution.getFolder !== "undefined" && recentSolution.getFolder("path") !== solution.getFolder("path")) {
                    recentSolution.close();
                    recentSolution = null;
                }
            }
        }
        if (storage.tryLock()) {
            storage.setItem("logFilePathHash", logFilePathHash);
            storage.unlock();
        }
    }
    return solutions;
};
exports.closeSolution = function close_solution() {
    var jobId = admin.closeSolution();
    logout();
    return jobId;
};

function startMaintenance(type, options) {
    var maintenanceResults;
    switch (type) {
        case "verify":
            maintenanceResults = admin.Verify(options);
            break;
        case "repair":
            maintenanceResults = admin.Repair(options);
            break;
        case "compact":
            maintenanceResults = admin.Compact(options);
            break;
        case "backup":
            maintenanceResults = admin.Backup(options);
            break;
        case "restore":
            maintenanceResults = admin.Restore(options);
            break;
   }
    var date = new Date(maintenanceResults.file.date);
    maintenanceResults.file.hash = hex_md5(maintenanceResults.file.path);
    maintenanceResults.file.formatedDate = formatDate(date);
    maintenanceResults.file.date = '' + date.getTime();
    if (storage.tryLock()) {
        var logFileStorage = storage.getItem("logFilePathHash");
        logFileStorage[maintenanceResults.file.hash] = maintenanceResults.file.path;
        storage.setItem("logFilePathHash", logFileStorage);
        storage.unlock();
    }
    return maintenanceResults;
}
exports.verifyApplication = function verifyApplication(option) {
    return startMaintenance('verify',{
        applicationName: option.applicationName,
        solutionPath: option.solutionPath
    });
};
exports.repairApplication = function repairApplication(option) {
    return startMaintenance('repair',{
        applicationName: option.applicationName,
        solutionPath: option.solutionPath
    });
};
exports.compactApplication = function compactApplication(option) {
    return startMaintenance('compact',{
        applicationName: option.applicationName,
        solutionPath: option.solutionPath
    });
};
exports.backupApplication = function backupApplication(option) {
    return startMaintenance('backup',{
        applicationName: option.applicationName,
        solutionPath: option.solutionPath
    });
};
exports.restoreApplication = function restore_application(option) {
    return startMaintenance('restore',{
        restoreDate: option.restoreDate,
        solutionPath: option.solutionPath,
        applicationName: option.applicationName
    });
};
exports.getSettingJsonData = function getSettingJsonData(solutionPath, applicationName) {
    var app, str, file, stream, settingXml, settingSolution;
    if (solutionPath === null) {
        solutionPath = solution.getFolder('path') + solution.name + ".waSolution";
    }
    try {
        if (solution.getFolder('path') + solution.name + ".waSolution" === solutionPath) {
            settingSolution = solution;
        } else {
            settingSolution = internal.openSolution(solutionPath, 2);
        } if (applicationName === null) {
            file = settingSolution.getSettingFile("database");
            stream = TextStream(file, "read");
            str = stream.read();
            settingXml = XmlToJSON(str, "json-bag", "settings");
            stream.close();
        } else {
            app = settingSolution.getApplicationByName(applicationName);
            if (app !== null) {
                file = app.getSettingFile("project");
                stream = TextStream(file, "read");
                str = stream.read();
                settingXml = XmlToJSON(str, "json-bag", "settings");
                stream.close();
            } else {
                settingXml = null;
            }
        }
    } catch (e) {} finally {
        if (settingSolution !== null && settingSolution.getFolder('path') !== solution.getFolder('path')) {
            settingSolution.close();
        }
    }
    return settingXml;
};
exports.getLocalIpAdresses = function get_local_ip_adresses() {
    var i, returnArray, localInterface, interfaceLength, localInterfaces, localInterfaceName;
    returnArray = [];
    localInterfaces = os.networkInterfaces();
    for (localInterfaceName in localInterfaces) {
        localInterface = localInterfaces[localInterfaceName];
        interfaceLength = localInterface.length;
        for (i = 0; i < interfaceLength; i++) {
            returnArray.push(localInterface[i].address);
        }
    }
    return returnArray;
};
exports.getLogMessages = function get_log_messages() {
    var log;
    log = {};
    log.messages = console.content;
    log.messages.forEach(function(element, index, messageArray) {
        messageArray[index] = element.replace(", HTTP connection handler", "");
    });
    return log;
};
exports.getMaintenanceLog = function get_maintenance_log(fromId) {
    return admin.getMaintenanceLog(fromId);
};
exports.saveSettingJsonData = function saveSettingJsonData(recentSolutionPath, applicationName, settingsJson) {
    var app, file, stream, settingXml, settingSolution, closeSolFlag;
    settingXml = JSONToXml(settingsJson, "json-bag", "settings");
    try 
    {
        if (solution !== null && solution.getFolder('path') + solution.name + ".waSolution" === recentSolutionPath) {
            settingSolution = solution;
            closeSolFlag = false;
        } else {
            settingSolution = internal.openSolution(recentSolutionPath, 2);
            closeSolFlag = true;
        } if (applicationName === null) {
            file = settingSolution.getSettingFile("database");
            stream = TextStream(file, "overwrite");
            stream.write(settingXml);
            stream.close();
        } else {
            app = settingSolution.getApplicationByName(applicationName);
            if (app !== null) 
            {
                file = app.getSettingFile("project");
                stream = TextStream(file, "overwrite");
                stream.write(settingXml);
                stream.close();
            } 
            else {
                settingXml = null;
            }
        };
    }
    catch (e) {
        return false;
    } finally {
        if (settingSolution !== null && closeSolFlag) {
            settingSolution.close();
        }
    }
    return true;
};

function getSettingsFromSolution(sol) {
    var str, file, stream, returnObject, settingsObject;
    returnObject = {};
    try {
        file = sol.getSettingFile("database");
        stream = TextStream(file, "read");
        str = stream.read();
        settingsObject = JSON.parse(XmlToJSON(str, "json-bag", "settings"));
        returnObject = {};
        if (settingsObject.hasOwnProperty("database") && settingsObject.database.length > 0) {
            returnObject.database = settingsObject.database[0];
        } else {
            returnObject.database = {};
        }
        returnObject.solution = {};
        if (settingsObject.solution[0].hasOwnProperty("directory") && settingsObject.solution[0].directory.length > 0) {
            returnObject.solution.directory = settingsObject.solution[0].directory[0];
        } else {
            returnObject.solution.directory = {};
        } if (settingsObject.solution[0].hasOwnProperty("serverStartup") && settingsObject.solution[0].serverStartup.length > 0) {
            returnObject.solution.serverStartup = settingsObject.solution[0].serverStartup[0];
        } else {
            returnObject.solution.directory = {};
        }
    } catch (e) {
        console.log("Error reading solution settings files", e);
    }
    return returnObject;
}

function getModelData(app) {
    var i, dataFolder;
    if (app.name === "ServerAdmin") {
        return null;
    }
    if (Folder.isFolder(app.getFolder().path + "DataFolder")) {
        dataFolder = app.getItemsWithRole("dataFolder").files;
        for (i = 0; i < dataFolder.length; i++) {
            if (dataFolder[i].name === "data.waData") {
                return File(dataFolder[i].path);
            }
        }
        return null;
    } else {
        return File(app.getItemsWithRole("data").path);
    }
}
exports.setDebuggerServer = function setDebuggerServer(debugMode) {
    var job = getJobManager().getJob();
    internal.setDebuggerServer(debugMode, job);
    return job.id;
};
exports.getDebuggerServer = function getDebuggerServer() {
    return internal.getDebuggerServer();
};
exports.isDebugging = function isDebugging() {
    return internal.isDebugging();
};
exports.startDebugger = function startDebugger() {
    return internal.startDebugger();
};
exports.stopDebugger = function stopDebugger() {
    return internal.stopDebugger();
};
exports.canSetDebuggerServer = function canSetDebuggerServer(debugMode) {
    return internal.canSetDebuggerServer(debugMode);
};
exports.getDebuggerStatus = function getDebuggerStatus(params) {
    return internal.getDebuggerStatus(params);
};
exports.getBreakpoints = function getBreakpoints(params) {
    return internal.getBreakpoints(params);
};
exports.setBreakpoints = function setBreakpoints(params) {
    return internal.setBreakpoints(params);
};
exports.removeBreakpoints = function removeBreakpoints(params) {
    return internal.removeBreakpoints(params);
};
exports.getLocalIpAdresses = function get_local_ip_adresses() {
    var i, returnArray, localInterface, interfaceLength, localInterfaces, localInterfaceName;
    returnArray = [];
    localInterfaces = os.networkInterfaces();
    for (localInterfaceName in localInterfaces) {
        localInterface = localInterfaces[localInterfaceName];
        interfaceLength = localInterface.length;
        for (i = 0; i < interfaceLength; i++) {
            returnArray.push(localInterface[i].address);
        }
    }
    return returnArray;
};
exports.setService = function set_service(applicationName, serviceName, enable) {
    var service, application;
    application = solution.getApplicationByName(applicationName);
    service = application[serviceName];
    (enable) ? service.enable() : service.disable();
    return service.enabled;
};
exports.setServer = function set_server(applicationName, serverName, start) {
    var server, application;
    application = solution.getApplicationByName(applicationName);
    server = application[serverName];
    (start) ? server.start() : server.stop();
    return server.started;
};
exports.stopRPCForApp = function stop_rpc_for_app(appName) {
    var app, rpcService;
    app = solution.getApplicationByName(appName);
    rpcService = require("services/rpc").getInstanceFor(app);
    if ((rpcService !== null) && (typeof rpcService !== 'undefined')) {
        rpcService.stop();
        return !rpcService.isStarted();
    }
    return false;
};
exports.startRPCForApp = function start_rpc_for_app(appName) {
    var app, rpcService;
    app = solution.getApplicationByName(appName);
    rpcService = require("services/rpc").getInstanceFor(app);
    if ((rpcService !== null) && (typeof rpcService !== 'undefined')) {
        rpcService.start();
        return rpcService.isStarted();
    }
    return false;
};
exports.stopDataServiceForApp = function stop_data_service_for_app(appName) {
    var app, dataStoreService;
    app = solution.getApplicationByName(appName);
    dataStoreService = require("services/dataStore").getInstanceFor(app);
    if ((dataStoreService !== null) && (typeof dataStoreService !== 'undefined')) {
        dataStoreService.stop();
        return !dataStoreService.isStarted();
    }
    return false;
};
exports.startDataServiceForApp = function start_data_service_for_app(appName) {
    var app, dataStoreService;
    app = solution.getApplicationByName(appName);
    dataStoreService = require("services/dataStore").getInstanceFor(app);
    if ((dataStoreService !== null) && (typeof dataStoreService !== 'undefined')) {
        dataStoreService.start();
        return dataStoreService.isStarted();
    }
    return false;
};
exports.stopWebAppForApp = function stop_web_app_for_app(appName) {
    var app, webAppService;
    app = solution.getApplicationByName(appName);
    webAppService = require("services/webApp").getInstanceFor(app);
    if ((webAppService !== null) && (typeof webAppService !== 'undefined')) {
        webAppService.stop();
        return !webAppService.isStarted();
    }
    return false;
};
exports.startWebAppForApp = function start_web_app_for_app(appName) {
    var app, webAppService;
    app = solution.getApplicationByName(appName);
    webAppService = require("services/webApp").getInstanceFor(app);
    if ((webAppService !== null) && (typeof webAppService !== 'undefined')) {
        webAppService.start();
        return webAppService.isStarted();
    }
    return false;
};
exports.stopHTTPServerForApp = function stop_HTTP_server_for_app(appName) {
    var app;
    app = solution.getApplicationByName(appName);
    if (app.httpServer.started) {
        app.httpServer.stop();
    }
    return true; //return !app.httpServer.started;
};
exports.startHTTPServerForApp = function start_HTTP_server_for_app(appName) {
    var app;
    app = solution.getApplicationByName(appName);
    if (!app.httpServer.started) {
        app.httpServer.start();
    }
    return app.httpServer.started;
};
exports.stopSqlServerForApp = function stop_sql_server_for_app(appName) {
    var app;
    app = solution.getApplicationByName(appName);
    if (app.sqlServer.started) {
        app.sqlServer.stop();
    }
    return !app.sqlServer.started;
};
exports.startSqlServerForApp = function start_sql_server_for_app(appName) {
    var app;
    app = solution.getApplicationByName(appName);
    if (!app.sqlServer.started) {
        app.sqlServer.start();
    }
    return app.sqlServer.started;
};
exports.quitServer = function quit_server() {
    solution.quitServer();
    return true;
};
exports.getDebuggerPort = function get_debugger_port() {
    if (solution !== null) {
        return solution.getDebuggerPort();
    }
    return null;
};
exports.hasAdministrator = function has_administrator() {
    return directory.hasAdministrator();
};
exports.reloadModels = function reload_models(applicationNames) {
    var i, modelReloaded, modelToReload, currentApplication, applicationsLength, applicationToReload;
    modelReloaded = 0;
    modelToReload = applicationNames.length;
    applicationToReload = {};
    applicationNames.forEach(function(value, index) {
        applicationToReload[value] = 1;
    });
    if (solution !== null) {
        applicationsLength = solution.applications.length;
        if (applicationsLength > 0) {
            i = 0;
            while (modelReloaded < modelToReload && i < applicationsLength) {
                currentApplication = solution.applications[i];
                if (applicationToReload.hasOwnProperty(currentApplication.name)) {
                    currentApplication.reloadModel();
                    modelReloaded++;
                }
                i++;
            }
        }
    }
    return (modelReloaded === modelToReload);
};

exports.getProductName = function get_product_name() {
    return process.productName;
};


function getLicenseFile () {
//    var filePath  = solution.applications[0].getFolder().path + "license/license.json" ;
//    var file = File(filePath);
//    if (file.exists) {
//        return filePath;
//    }
    return null;
}

exports.isLicenseOk = function isLicenseOk() {
    // search for license in storage var
//    var license = storage.getItem("licenseFile") || getLicenseFile() ;
//    if (license === null) {
//        return false;
//    } else {
//        
//    }
    return false;
};


exports.resetCache = function resetCache(projetName) {
    var  port, url, ip, xhr, app, protocol, result;

    app = solution.getApplicationByName(projetName);
    if (!app) {
        result =  {
                status: 404,
                text: "Application does not exist"
        };
    } else {
        xhr     = new XMLHttpRequest();
        ip      = app.httpServer.ipAddress;
        port    = app.httpServer.ssl.enabled ? app.httpServer.ssl.port : app.httpServer.port;
        protocol = app.httpServer.ssl.enabled ? 'https' : 'http';
        url     = protocol + "://"+ ip + ":" + port + "/waf-reset-build-cache";

        xhr.open('GET', url, false); 
        xhr.send();
        if (xhr.status == 200) {
            result = {                    
                status: xhr.status,
                text: xhr.responseText
            };  
        } else {
            result = {
                status: xhr.status,
                text: xhr.responseText   
            };                
        }
    }
    return result;   
};


/* * Need for studio */
exports.openSolution = function open_solution(path, debuggerType) {
    var returnVal = admin.openSolution(path, debuggerType);
    logout();
    return returnVal;
};
exports.getRecentSolutions = function get_recent_solutions() {
    var i, res, sol, path, pathHash, solutions, isRunning, recentSolutions;
    res = internal.recentlyOpenedSolution();
    solutions = [];
    recentSolutions = storage.getItem("recentSolutions");
    if (recentSolutions === null) {
        recentSolutions = {};
    }
    for (i = 0; i < res.length; i++) {
        path = res[i].solutionFile.path;
        if (File.isFile(path)) {
            if (solution.getFolder().path + solution.name + ".waSolution" === path) {
                isRunning = true;
            } else {
                isRunning = false;
            }
            pathHash = hex_md5(path);
            sol = {
                name: res[i].name,
                hash: pathHash,
                isRunning: isRunning
            };
            recentSolutions[pathHash] = {
                name: res[i].name,
                path: path
            };
            solutions.push(sol);
        }
    }
    if (storage.tryLock()) {
        storage.setItem("recentSolutions", recentSolutions);
        storage.unlock();
    }
    return solutions;
};
exports.Files = function files(option) {
    var sol, app, obj, hash, dataPath, folderlog, recentSolution, newSolutionOpen, logFilePathHash, dataFolderName;
    sol = null;
    recentSolution = getRecentSolutionFromStorage(option.hash);
    try {
        if (recentSolution.path !== solution.getFolder().path + solution.name + ".waSolution") {
            sol = internal.openSolution(recentSolution.path, 2);
            newSolutionOpen = true;
        } else {
            sol = solution;
            newSolutionOpen = false;
        } if ((sol !== null) && (typeof sol !== 'undefined')) {
            app = sol.getApplicationByName(option.applicationName); //data folder in wak2 called data and in wak3 called dataFolder 
            if (Folder.isFolder(app.getFolder().path + "DataFolder")) {
                dataFolderName = "dataFolder";
            } else {
                dataFolderName = "data";
            } if ((app.getItemsWithRole(dataFolderName) === null) || (typeof app.getItemsWithRole(dataFolderName) === 'undefined')) {
                obj = {};
                obj.files = [];
            } else { //dataPath = app.getFolder().path + dataFolderName+'/';
                folderlog = Folder(app.getFolder().path + 'Logs');
                obj = {};
                obj.files = {
                    "verify": [],
                    "repair": [],
                    "compact": [],
                    "backup": [],
                    "unknow": []
                };
                logFilePathHash = {};
                folderlog.forEachFile(function(file) {
                    var fileObject;
                    fileObject = {};
                    fileObject.name = file.name;
                    fileObject.date = file.creationDate;
                    hash = hex_md5(file.path);
                    logFilePathHash[hash] = file.path;
                    fileObject.path = hash;
                    if (file.name.substr(0, 6) === "verify") {
                        obj.files.verify.push(fileObject);
                    } else if (file.name.substr(0, 6) === "repair") {
                        obj.files.repair.push(fileObject);
                    } else if (file.name.substr(0, 7) === "compact") {
                        obj.files.compact.push(fileObject);
                    } else if (file.name.substr(0, 6) === "backup") {
                        obj.files.backup.push(fileObject);
                    } else {
                        obj.files.unknow.push(fileObject);
                    }
                });
            } if (storage.tryLock()) {
                storage.setItem("logFilePathHash", logFilePathHash);
                storage.unlock();
            }
        }
    } catch (e) {} finally {
        if ((sol !== null) && (typeof sol !== 'undefined') && newSolutionOpen) {
            sol.close();
            sol = null;
        }
    }
    return obj;
};
exports.getSettingsFilesForApp = function get_settings_files_for_app(appName) {
    var i, j, app, res, file, files, types, found;
    types = ['project', 'http', 'webApp', 'dataService', 'rpc', 'database'];
    app = solution.getApplicationByName(appName);
    res = {};
    files = [];
    for (i = 0; i < types.length; i++) {
        file = app.getSettingFile(types[i], 'relativePath');
        res[types[i]] = {
            'file': file
        };
        j = 0;
        found = false;
        while (!found && j < files.length) {
            if (file === files[j]) {
                found = true;
            }
            j++;
        }
        if (!found && file !== null) {
            files.push(file);
        }
    }
    res.files = files;
    return res;
};
exports.getSolution = function get_solution() {
    var i, app, obj, dataPath, dataFile, folderlog, rpcService, webAppService, dataStoreService, dataFolderName; // this var is created to maintain a compatibily between WAK3 and WAK2
    obj = {};
    obj.name = solution.name;
    obj.hash = hex_md5(solution.getFolder('path') + solution.name + ".waSolution");
    obj.path = solution.getFolder('path') + solution.name + ".waSolution";
    obj.applications = [];
    for (i = 0; i < solution.applications.length; i++) { //data folder in wak2 called data and in wak3 called dataFolder 
        if (Folder.isFolder(solution.applications[i].getFolder().path + "DataFolder")) {
            dataFolderName = "dataFolder";
        } else {
            dataFolderName = "data";
        }
        app = {};
        app.name = solution.applications[i].name;
        app.path = solution.applications[i].getFolder('path');
        app.admin = solution.applications[i].administrator;
        app.pattern = solution.applications[i].pattern;
        if ((solution.applications[i].getItemsWithRole("catalog") !== null) && (typeof solution.applications[i].getItemsWithRole("catalog") !== 'undefined')) {
            app.waModel = solution.applications[i].getItemsWithRole("catalog").path;
        } else {
            app.waModel = "";
            app.waModelshort = "";
        }
        dataFile = getModelData(solution.applications[i]);
        if (dataFile && dataFile.exists) {
            app.waData = dataFile.path;
            dataPath = app.path + dataFolderName + '/';
            app.files = [];
            folderlog = Folder(app.path + 'Logs');
            folderlog.forEachFile(function(file) {
                var f;
                f = {};
                f.name = file.name;
                f.date = file.creationDate;
                f.path = file.path;
                app.files.push(f); // store the file path
            });
        } else {
            app.waData = "";
            app.waDatashort = "";
            app.files = [];
        }
        app.http = {
            enabled: solution.applications[i].httpServer.started,
            ip: solution.applications[i].httpServer.ipAddress,
            port: solution.applications[i].httpServer.port,
            hostName: solution.applications[i].httpServer.hostName,
            sslPort: application.httpServer.ssl.port
        };
        app.webApp = {
            enabled: false,
            directoryIndex: ''
        };
        webAppService = require('services/webApp').getInstanceFor(solution.applications[i]);
        if ((webAppService !== null) && (typeof webAppService !== 'undefined')) {
            app.webApp.enabled = webAppService.isStarted();
            app.webApp.directoryIndex = solution.applications[i].settings.getItem('services')['webApp'].directoryIndex;
        }
        app.dataService = {
            enabled: false
        };
        dataStoreService = require('services/dataStore').getInstanceFor(solution.applications[i]);
        if ((dataStoreService !== null) && (typeof dataStoreService !== 'undefined')) {
            app.dataService.enabled = dataStoreService.isStarted();
        }
        app.rpcService = {
            enabled: false
        };
        rpcService = require('services/rpc').getInstanceFor(solution.applications[i]);
        if ((rpcService !== null) && (typeof rpcService !== 'undefined')) {
            app.rpcService.enabled = rpcService.isStarted();
        }
        app.fileService = {
            enabled: false
        };
        obj.applications.push(app);
    }
    return obj;
};
exports.getSolutionMaintenance = function get_solution_maintenance(hash) {
    var i, sol, obj, app, dataPath, dataFile, folderlog, rpcService, application, webAppService, recentSolution, recentSolutions, dataStoreService, dataFolderName;
    try {
        sol = null;
        recentSolution = null;
        recentSolutions = storage.recentSolutions;
        if (recentSolutions.hasOwnProperty(hash)) {
            recentSolution = recentSolutions[hash];
        }
        obj = {};
        if (recentSolution !== null) {
            sol = internal.openSolution(recentSolution.path, 2);
            if ((sol !== null) && (typeof sol !== 'undefined')) {
                obj.name = sol.name;
                obj.hash = hex_md5(recentSolution.path);
                obj.applications = [];
                obj.settings = getSettingsFromSolution(sol);
                for (i = 0; i < sol.applications.length; i++) {
                    application = sol.applications[i];
                    if (Folder.isFolder(application.getFolder().path + "DataFolder")) {
                        dataFolderName = "dataFolder";
                    } else {
                        dataFolderName = "data";
                    }
                    app = {};
                    app.name = application.name;
                    app.path = application.getFolder('path');
                    app.admin = application.administrator;
                    app.pattern = application.pattern;
                    if ((application.getItemsWithRole("catalog") !== null) && (typeof application.getItemsWithRole("catalog") !== 'undefined')) {
                        app.waModel = application.getItemsWithRole("catalog").path;
                    } else {
                        app.waModel = "";
                        app.waModelshort = "";
                    }
                    dataFile = getModelData(application);
                    if ((dataFile !== null) && (typeof dataFile !== 'undefined')) {
                        app.waData = dataFile.path;
                        dataPath = dataFile.path.substr(0, dataFile.path.lastIndexOf("/") + 1);
                        app.files = [];
                        folderlog = Folder(app.path + 'Logs');
                        folderlog.forEachFile(function(file) {
                            var f;
                            f = {};
                            f.name = file.name;
                            f.date = file.creationDate;
                            f.path = file.path;
                            app.files.push(f); // store the file path
                        });
                    } else {
                        app.waData = "";
                        app.waDatashort = "";
                        app.files = [];
                    }
                    app.http = {
                        enabled: application.httpServer.started,
                        ip: application.httpServer.ipAddress,
                        port: application.httpServer.port,
                        hostName: application.httpServer.hostName,
                        sslPort: application.httpServer.ssl.port
                    };
                    app.webApp = {
                        enabled: false,
                        directoryIndex: ''
                    };
                    webAppService = require('services/webApp').getInstanceFor(application);
                    if ((webAppService !== null) && (typeof webAppService !== 'undefined')) {
                        app.webApp.enabled = webAppService.isStarted();
                        app.webApp.directoryIndex = application.settings.getItem('services')['webApp'].directoryIndex;
                    }
                    app.dataService = {
                        enabled: false
                    };
                    dataStoreService = require('services/dataStore').getInstanceFor(application);
                    if ((dataStoreService !== null) && (typeof dataStoreService !== 'undefined')) {
                        app.dataService.enabled = dataStoreService.isStarted();
                    }
                    app.rpcService = {
                        enabled: false
                    };
                    rpcService = require('services/rpc').getInstanceFor(application);
                    if ((rpcService !== null) && (typeof rpcService !== 'undefined')) {
                        app.rpcService.enabled = rpcService.isStarted();
                    }
                    app.fileService = {
                        enabled: false
                    };
                    obj.applications.push(app);
                }
            } else {
                console.log("Error : cannot open " + recentSolution.name + " solution");
                sol = null;
            }
        }
    } catch (e) {
        sol = null;
        console.log("Error : ", e);
    } finally {
        if (sol !== null) {
            sol.close();
            sol = null;
        }
    }
    return obj;
};
exports.openSolutionByPath = function open_solution(path) {
    var returnVal;
    path = path.split("%20").join(" ");
    var file = new File(path);
    if (!file.exists) { // if the file does not exist
        return {
            "error": "File not found",
            "message": path + " is not found on the server"
        };
    }
    returnVal = admin.openSolution(path);
    logout();
    return returnVal;
};
exports.openRecentSolution = function open_recent_solution(hash) {
    var recentSolutions = storage.recentSolutions;
    try {
        if (recentSolutions.hasOwnProperty(hash)) {
            return admin.openSolution(recentSolutions[hash].path);
        } else {
            throw "Cannot open this solution";
        }
    } catch (e) {
        console.log("Error : ", e);
        return false;
    }
};
exports.getSettingsFileForSolution = function get_settings_file_for_solution(hash) {
    var sol, settingsObject, reopenSolution, recentSolution, recentSolutions;
    sol = null;
    recentSolutions = storage.recentSolutions;
    if (recentSolutions.hasOwnProperty(hash)) {
        recentSolution = recentSolutions[hash];
    } else {
        console.log("Error : solution not found");
        return false;
    }
    try {
        if (recentSolution.path !== solution.getFolder().path + solution.name + ".waSolution") {
            sol = internal.openSolution(recentSolution.path, 2);
            reopenSolution = true;
        } else {
            sol = solution;
            reopenSolution = false;
        }
    } catch (e) {
        console.log("Error : ", e);
        if (reopenSolution) {
            sol.close();
        }
        return false;
    }
    settingsObject = getSettingsFromSolution(sol);
    if (reopenSolution && sol !== null && sol !== undefined) {
        sol.close();
    }
    return settingsObject;
};
exports.getCurrentRunningHash = function get_current_running_hash() {
    if (solution !== null) {
        return hex_md5(solution.getFolder('path'));
    }
    return null;
};

function formatDate(date) {
    var formatedDate = ('' + date.toLocaleDateString());
    formatedDate = formatedDate + ' ' + ('0' + date.getHours()).substr(-2, 2) + ':' + ('0' + date.getMinutes()).substr(-2, 2) + ':' + ('0' + date.getSeconds()).substr(-2, 2);
    return formatedDate;
};
