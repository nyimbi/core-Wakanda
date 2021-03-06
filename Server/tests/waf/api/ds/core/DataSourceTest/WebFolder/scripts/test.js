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
WAF.onAfterInit = function onAfterInit() {// @lock
	// "use strict";
// @region namespaceDeclaration// @startlock
	var documentEvent = WAF.namespace("DataProviderTest.index.documentEvent.events");	// @document
	var CitiesEvent = WAF.namespace("DataProviderTest.index.Cities.events");	// @dataSource
// @endregion// @endlock

// eventHandlers// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		variable = 0;
		source.VariableDS.sync();
		
		arrayDS = 
			[
			{
				name:'Paris',
				pop:2000000
			},
			{
				name:'Cupertino',
				pop:250000
			},
			{
				name:'New York',
				pop:4000000
			},
			{
				name:'Palo Alto',
				pop:140000
			}
			];
			source.ArrayDS.sync();
			
	};// @lock

	CitiesEvent.entitySet = function CitiesEvent_entitySet (event)// @startlock
	{// @endlock

	};// @lock

	CitiesEvent.currentEntity = function CitiesEvent_currentEntity (event)// @startlock
	{// @endlock

	};// @lock

// @region eventManager// @startlock
	WAF.addListener("documentEvent", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("Cities", "entitySet", CitiesEvent.entitySet, "WAF");
	WAF.addListener("Cities", "currentEntity", CitiesEvent.currentEntity, "WAF");
// @endregion
};// @endlock
