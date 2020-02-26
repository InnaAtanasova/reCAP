/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Renderer","sap/ui/core/library"],function(e,t){"use strict";var i=t.TextDirection;var r={apiVersion:2};r.render=function(t,r){var s=r.getTextDirection(),a=e.getTextAlign(r.getTextAlign(),s),n=r._determineSelfReferencePresence(),d=r.getHref(),l={labelledby:n?{value:r.getId(),append:true}:undefined},g=d&&r._isHrefValid(d),b=r.getEnabled();t.openStart("a",r);t.class("sapMLnk");if(r.getSubtle()){t.class("sapMLnkSubtle");if(l.describedby){l.describedby+=" "+r._sAriaLinkSubtleId}else{l.describedby=r._sAriaLinkSubtleId}}if(r.getEmphasized()){t.class("sapMLnkEmphasized");if(l.describedby){l.describedby+=" "+r._sAriaLinkEmphasizedId}else{l.describedby=r._sAriaLinkEmphasizedId}}if(!b){t.class("sapMLnkDsbl");t.attr("disabled","true");l.disabled=null}t.attr("tabindex",r._getTabindex());if(r.getWrapping()){t.class("sapMLnkWrapping")}if(r.getTooltip_AsString()){t.attr("title",r.getTooltip_AsString())}if(g&&b){t.attr("href",d)}else{t.attr("href","")}if(r.getTarget()){t.attr("target",r.getTarget())}if(r.getWidth()){t.style("width",r.getWidth())}else{t.class("sapMLnkMaxWidth")}if(a){t.style("text-align",a)}if(s!==i.Inherit){t.attr("dir",s.toLowerCase())}t.accessibilityState(r,l);t.openEnd();if(this.writeText){this.writeText(t,r)}else{this.renderText(t,r)}t.close("a")};r.renderText=function(e,t){e.text(t.getText())};return r},true);