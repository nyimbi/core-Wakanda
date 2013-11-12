/* * This file is part of Wakanda software, licensed by 4D under *  (i) the GNU General Public License version 3 (GNU GPL v3), or *  (ii) the Affero General Public License version 3 (AGPL v3) or *  (iii) a commercial license. * This file remains the exclusive property of 4D and/or its licensors * and is protected by national and international legislations. * In any event, Licensee's compliance with the terms and conditions * of the applicable license constitutes a prerequisite to any use of this file. * Except as otherwise expressly stated in the applicable license, * such license does not include any other license or rights on this file, * 4D's and/or its licensors' trademarks and/or other proprietary rights. * Consequently, no title, copyright or other proprietary rights * other than those specified in the applicable license is granted. */﻿WAF.Widget.prototype.center = function(config){	var	htmlObj 	= this.$domNode,	width		= this.getWidth(),	parent		= htmlObj.parent(),	height		= this.getHeight();		if(parent.attr('id') === $('body').attr('id')){		parent = $(window);	}		/**	 * Config : 	 *    center 			==> 'v' : only vertically	 *				 			'h' : only horizontally	 *				 			'vh': horizontally and vertically	 **/	if(arguments.length == 0){		htmlObj.css({			left	: (parent.width() - width)/2,			top		: (parent.height() - height)/2		});				return;	}		switch(config.center){		case 'v' :			htmlObj.css({				top		: (parent.height() - height)/2			});			break;		case 'h' :			htmlObj.css({				left	: (parent.width() - width)/2			});			break;		case 'vh' :			htmlObj.css({				left	: (parent.width() - width)/2,				top		: (parent.height() - height)/2			});			break;	}}