"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[1989],{"./packages/i18n/build-module/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{__:()=>__,_n:()=>_n,_x:()=>_x,V8:()=>isRTL,nv:()=>sprintf_sprintf});var dist=__webpack_require__("./node_modules/memize/dist/index.js"),sprintf=__webpack_require__("./node_modules/sprintf-js/src/sprintf.js"),sprintf_default=__webpack_require__.n(sprintf);const logErrorOnce=(0,dist.A)(console.error);function sprintf_sprintf(format,...args){try{return sprintf_default().sprintf(format,...args)}catch(error){return error instanceof Error&&logErrorOnce("sprintf error: \n\n"+error.toString()),format}}var node_modules_tannin=__webpack_require__("./node_modules/tannin/index.js");const DEFAULT_LOCALE_DATA_={plural_forms:n=>1===n?0:1},I18N_HOOK_REGEXP=/^i18n\.(n?gettext|has_translation)(_|$)/;const i18n=((initialData,initialDomain,hooks)=>{const tannin=new node_modules_tannin.A({}),listeners=new Set,notifyListeners=()=>{listeners.forEach((listener=>listener()))},doSetLocaleData=(data,domain="default")=>{tannin.data[domain]={...tannin.data[domain],...data},tannin.data[domain][""]={...DEFAULT_LOCALE_DATA_,...tannin.data[domain]?.[""]},delete tannin.pluralForms[domain]},setLocaleData=(data,domain)=>{doSetLocaleData(data,domain),notifyListeners()},dcnpgettext=(domain="default",context,single,plural,number)=>(tannin.data[domain]||doSetLocaleData(void 0,domain),tannin.dcnpgettext(domain,context,single,plural,number)),getFilterDomain=(domain="default")=>domain,_x=(text,context,domain)=>{let translation=dcnpgettext(domain,context,text);return hooks?(translation=hooks.applyFilters("i18n.gettext_with_context",translation,text,context,domain),hooks.applyFilters("i18n.gettext_with_context_"+getFilterDomain(domain),translation,text,context,domain)):translation};if(initialData&&setLocaleData(initialData,initialDomain),hooks){const onHookAddedOrRemoved=hookName=>{I18N_HOOK_REGEXP.test(hookName)&&notifyListeners()};hooks.addAction("hookAdded","core/i18n",onHookAddedOrRemoved),hooks.addAction("hookRemoved","core/i18n",onHookAddedOrRemoved)}return{getLocaleData:(domain="default")=>tannin.data[domain],setLocaleData,addLocaleData:(data,domain="default")=>{tannin.data[domain]={...tannin.data[domain],...data,"":{...DEFAULT_LOCALE_DATA_,...tannin.data[domain]?.[""],...data?.[""]}},delete tannin.pluralForms[domain],notifyListeners()},resetLocaleData:(data,domain)=>{tannin.data={},tannin.pluralForms={},setLocaleData(data,domain)},subscribe:callback=>(listeners.add(callback),()=>listeners.delete(callback)),__:(text,domain)=>{let translation=dcnpgettext(domain,void 0,text);return hooks?(translation=hooks.applyFilters("i18n.gettext",translation,text,domain),hooks.applyFilters("i18n.gettext_"+getFilterDomain(domain),translation,text,domain)):translation},_x,_n:(single,plural,number,domain)=>{let translation=dcnpgettext(domain,void 0,single,plural,number);return hooks?(translation=hooks.applyFilters("i18n.ngettext",translation,single,plural,number,domain),hooks.applyFilters("i18n.ngettext_"+getFilterDomain(domain),translation,single,plural,number,domain)):translation},_nx:(single,plural,number,context,domain)=>{let translation=dcnpgettext(domain,context,single,plural,number);return hooks?(translation=hooks.applyFilters("i18n.ngettext_with_context",translation,single,plural,number,context,domain),hooks.applyFilters("i18n.ngettext_with_context_"+getFilterDomain(domain),translation,single,plural,number,context,domain)):translation},isRTL:()=>"rtl"===_x("ltr","text direction"),hasTranslation:(single,context,domain)=>{const key=context?context+""+single:single;let result=!!tannin.data?.[null!=domain?domain:"default"]?.[key];return hooks&&(result=hooks.applyFilters("i18n.has_translation",result,single,context,domain),result=hooks.applyFilters("i18n.has_translation_"+getFilterDomain(domain),result,single,context,domain)),result}}})(void 0,void 0,__webpack_require__("./packages/hooks/build-module/index.js").se),__=(i18n.getLocaleData.bind(i18n),i18n.setLocaleData.bind(i18n),i18n.resetLocaleData.bind(i18n),i18n.subscribe.bind(i18n),i18n.__.bind(i18n)),_x=i18n._x.bind(i18n),_n=i18n._n.bind(i18n),isRTL=(i18n._nx.bind(i18n),i18n.isRTL.bind(i18n));i18n.hasTranslation.bind(i18n)}}]);