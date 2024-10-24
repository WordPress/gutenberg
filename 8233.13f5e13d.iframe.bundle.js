/*! For license information please see 8233.13f5e13d.iframe.bundle.js.LICENSE.txt */
"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[8233],{"./node_modules/@ariakit/core/esm/tab/tab-store.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{p:()=>createTabStore});var _chunks_D7EIQZAU_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/D7EIQZAU.js"),_chunks_6DHTHWXD_js__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/6DHTHWXD.js"),_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/EQQLU3CG.js"),_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/PBFD2E7P.js"),_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/3YLGPPWQ.js");function createTabStore(_a={}){var _b=_a,{composite:parentComposite,combobox}=_b,props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.YG)(_b,["composite","combobox"]);const independentKeys=["items","renderedItems","moves","orientation","virtualFocus","includesBaseElement","baseElement","focusLoop","focusShift","focusWrap"],store=(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.od)(props.store,(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.cJ)(parentComposite,independentKeys),(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.cJ)(combobox,independentKeys)),syncState=null==store?void 0:store.getState(),composite=(0,_chunks_D7EIQZAU_js__WEBPACK_IMPORTED_MODULE_2__.z)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.IA)({},props),{store,includesBaseElement:(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.Jh)(props.includesBaseElement,null==syncState?void 0:syncState.includesBaseElement,!1),orientation:(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.Jh)(props.orientation,null==syncState?void 0:syncState.orientation,"horizontal"),focusLoop:(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.Jh)(props.focusLoop,null==syncState?void 0:syncState.focusLoop,!0)})),panels=(0,_chunks_6DHTHWXD_js__WEBPACK_IMPORTED_MODULE_4__.I)(),initialState=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.IA)({},composite.getState()),{selectedId:(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.Jh)(props.selectedId,null==syncState?void 0:syncState.selectedId,props.defaultSelectedId),selectOnMove:(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.Jh)(props.selectOnMove,null==syncState?void 0:syncState.selectOnMove,!0)}),tab=(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.y$)(initialState,composite,store);(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.mj)(tab,(()=>(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(tab,["moves"],(()=>{const{activeId,selectOnMove}=tab.getState();if(!selectOnMove)return;if(!activeId)return;const tabItem=composite.item(activeId);tabItem&&(tabItem.dimmed||tabItem.disabled||tab.setState("selectedId",tabItem.id))})))),(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.mj)(tab,(()=>(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.vA)(tab,["selectedId"],((state,prev)=>{parentComposite&&state.selectedId===prev.selectedId||tab.setState("activeId",state.selectedId)})))),(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.mj)(tab,(()=>(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(tab,["selectedId","renderedItems"],(state=>{if(void 0!==state.selectedId)return;const{activeId,renderedItems}=tab.getState(),tabItem=composite.item(activeId);if(!tabItem||tabItem.disabled||tabItem.dimmed){const tabItem2=renderedItems.find((item=>!item.disabled&&!item.dimmed));tab.setState("selectedId",null==tabItem2?void 0:tabItem2.id)}else tab.setState("selectedId",tabItem.id)})))),(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.mj)(tab,(()=>(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(tab,["renderedItems"],(state=>{const tabs=state.renderedItems;if(tabs.length)return(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(panels,["renderedItems"],(state2=>{const items=state2.renderedItems;items.some((panel=>!panel.tabId))&&items.forEach(((panel,i)=>{if(panel.tabId)return;const tabItem=tabs[i];tabItem&&panels.renderItem((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.IA)({},panel),{tabId:tabItem.id}))}))}))}))));let selectedIdFromSelectedValue=null;return(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.mj)(tab,(()=>{const backupSelectedId=()=>{selectedIdFromSelectedValue=tab.getState().selectedId},restoreSelectedId=()=>{tab.setState("selectedId",selectedIdFromSelectedValue)};return parentComposite&&"setSelectElement"in parentComposite?(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.cy)((0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(parentComposite,["value"],backupSelectedId),(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(parentComposite,["open"],restoreSelectedId)):combobox?(0,_chunks_PBFD2E7P_js__WEBPACK_IMPORTED_MODULE_3__.cy)((0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(combobox,["selectedValue"],backupSelectedId),(0,_chunks_EQQLU3CG_js__WEBPACK_IMPORTED_MODULE_1__.OH)(combobox,["open"],restoreSelectedId)):void 0})),(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.IA)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_0__.IA)({},composite),tab),{panels,setSelectedId:id=>tab.setState("selectedId",id),select:id=>{tab.setState("selectedId",id),composite.move(id)}})}},"./node_modules/deepmerge/dist/cjs.js":module=>{var isMergeableObject=function isMergeableObject(value){return function isNonNullObject(value){return!!value&&"object"==typeof value}(value)&&!function isSpecial(value){var stringValue=Object.prototype.toString.call(value);return"[object RegExp]"===stringValue||"[object Date]"===stringValue||function isReactElement(value){return value.$$typeof===REACT_ELEMENT_TYPE}(value)}(value)};var REACT_ELEMENT_TYPE="function"==typeof Symbol&&Symbol.for?Symbol.for("react.element"):60103;function cloneUnlessOtherwiseSpecified(value,options){return!1!==options.clone&&options.isMergeableObject(value)?deepmerge(function emptyTarget(val){return Array.isArray(val)?[]:{}}(value),value,options):value}function defaultArrayMerge(target,source,options){return target.concat(source).map((function(element){return cloneUnlessOtherwiseSpecified(element,options)}))}function getKeys(target){return Object.keys(target).concat(function getEnumerableOwnPropertySymbols(target){return Object.getOwnPropertySymbols?Object.getOwnPropertySymbols(target).filter((function(symbol){return Object.propertyIsEnumerable.call(target,symbol)})):[]}(target))}function propertyIsOnObject(object,property){try{return property in object}catch(_){return!1}}function mergeObject(target,source,options){var destination={};return options.isMergeableObject(target)&&getKeys(target).forEach((function(key){destination[key]=cloneUnlessOtherwiseSpecified(target[key],options)})),getKeys(source).forEach((function(key){(function propertyIsUnsafe(target,key){return propertyIsOnObject(target,key)&&!(Object.hasOwnProperty.call(target,key)&&Object.propertyIsEnumerable.call(target,key))})(target,key)||(propertyIsOnObject(target,key)&&options.isMergeableObject(source[key])?destination[key]=function getMergeFunction(key,options){if(!options.customMerge)return deepmerge;var customMerge=options.customMerge(key);return"function"==typeof customMerge?customMerge:deepmerge}(key,options)(target[key],source[key],options):destination[key]=cloneUnlessOtherwiseSpecified(source[key],options))})),destination}function deepmerge(target,source,options){(options=options||{}).arrayMerge=options.arrayMerge||defaultArrayMerge,options.isMergeableObject=options.isMergeableObject||isMergeableObject,options.cloneUnlessOtherwiseSpecified=cloneUnlessOtherwiseSpecified;var sourceIsArray=Array.isArray(source);return sourceIsArray===Array.isArray(target)?sourceIsArray?options.arrayMerge(target,source,options):mergeObject(target,source,options):cloneUnlessOtherwiseSpecified(source,options)}deepmerge.all=function deepmergeAll(array,options){if(!Array.isArray(array))throw new Error("first argument should be an array");return array.reduce((function(prev,next){return deepmerge(prev,next,options)}),{})};var deepmerge_1=deepmerge;module.exports=deepmerge_1},"./node_modules/fast-deep-equal/es6/index.js":module=>{module.exports=function equal(a,b){if(a===b)return!0;if(a&&b&&"object"==typeof a&&"object"==typeof b){if(a.constructor!==b.constructor)return!1;var length,i,keys;if(Array.isArray(a)){if((length=a.length)!=b.length)return!1;for(i=length;0!=i--;)if(!equal(a[i],b[i]))return!1;return!0}if(a instanceof Map&&b instanceof Map){if(a.size!==b.size)return!1;for(i of a.entries())if(!b.has(i[0]))return!1;for(i of a.entries())if(!equal(i[1],b.get(i[0])))return!1;return!0}if(a instanceof Set&&b instanceof Set){if(a.size!==b.size)return!1;for(i of a.entries())if(!b.has(i[0]))return!1;return!0}if(ArrayBuffer.isView(a)&&ArrayBuffer.isView(b)){if((length=a.length)!=b.length)return!1;for(i=length;0!=i--;)if(a[i]!==b[i])return!1;return!0}if(a.constructor===RegExp)return a.source===b.source&&a.flags===b.flags;if(a.valueOf!==Object.prototype.valueOf)return a.valueOf()===b.valueOf();if(a.toString!==Object.prototype.toString)return a.toString()===b.toString();if((length=(keys=Object.keys(a)).length)!==Object.keys(b).length)return!1;for(i=length;0!=i--;)if(!Object.prototype.hasOwnProperty.call(b,keys[i]))return!1;for(i=length;0!=i--;){var key=keys[i];if(!equal(a[key],b[key]))return!1}return!0}return a!=a&&b!=b}},"./node_modules/is-plain-object/dist/is-plain-object.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function isObject(o){return"[object Object]"===Object.prototype.toString.call(o)}function isPlainObject(o){var ctor,prot;return!1!==isObject(o)&&(void 0===(ctor=o.constructor)||!1!==isObject(prot=ctor.prototype)&&!1!==prot.hasOwnProperty("isPrototypeOf"))}__webpack_require__.d(__webpack_exports__,{Q:()=>isPlainObject})},"./packages/components/node_modules/@ariakit/react-core/esm/__chunks/DWZ7E5TJ.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Ay:()=>useComboboxContext,PV:()=>useComboboxProviderContext});var _WENSINUV_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/WENSINUV.js"),_54MGSIOI_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/54MGSIOI.js"),_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HKOOKEDE.js"),react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),ctx=((0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(void 0),(0,_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__.B0)([_54MGSIOI_js__WEBPACK_IMPORTED_MODULE_2__.wf,_WENSINUV_js__WEBPACK_IMPORTED_MODULE_3__.ws],[_54MGSIOI_js__WEBPACK_IMPORTED_MODULE_2__.s1,_WENSINUV_js__WEBPACK_IMPORTED_MODULE_3__.aN])),useComboboxContext=ctx.useContext,useComboboxProviderContext=(ctx.useScopedContext,ctx.useProviderContext);ctx.ContextProvider,ctx.ScopedContextProvider,(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(void 0),(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(!1)},"./packages/components/node_modules/@ariakit/react-core/esm/__chunks/JZUY7XL6.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{W:()=>useTabStore});var _DWZ7E5TJ_js__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/DWZ7E5TJ.js"),_KZ2S4ZC5_js__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/KZ2S4ZC5.js"),_UVQLZ7T5_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/UVQLZ7T5.js"),_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/2GXGCHW6.js"),_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/Z32BISHQ.js"),_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/3YLGPPWQ.js"),_ariakit_core_tab_tab_store__WEBPACK_IMPORTED_MODULE_7__=__webpack_require__("./node_modules/@ariakit/core/esm/tab/tab-store.js"),react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js");function useTabStore(props={}){const combobox=(0,_DWZ7E5TJ_js__WEBPACK_IMPORTED_MODULE_5__.Ay)(),composite=(0,_KZ2S4ZC5_js__WEBPACK_IMPORTED_MODULE_6__.hP)()||combobox;props=(0,_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_4__.ko)((0,_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_4__.IA)({},props),{composite:void 0!==props.composite?props.composite:composite,combobox:void 0!==props.combobox?props.combobox:combobox});const[store,update]=(0,_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_3__.Pj)(_ariakit_core_tab_tab_store__WEBPACK_IMPORTED_MODULE_7__.p,props);return function useTabStoreProps(store,update,props){(0,_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_1__.w5)(update,[props.composite,props.combobox]),store=(0,_UVQLZ7T5_js__WEBPACK_IMPORTED_MODULE_2__.Y)(store,update,props),(0,_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_3__.Tz)(store,props,"selectedId","setSelectedId"),(0,_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_3__.Tz)(store,props,"selectOnMove");const[panels,updatePanels]=(0,_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_3__.Pj)((()=>store.panels),{});return(0,_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_1__.w5)(updatePanels,[store,updatePanels]),Object.assign((0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)((()=>(0,_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_4__.ko)((0,_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_4__.IA)({},store),{panels})),[store,panels]),{composite:props.composite,combobox:props.combobox})}(store,update,props)}},"./packages/components/node_modules/@ariakit/react-core/esm/__chunks/KZ2S4ZC5.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{D1:()=>SelectScopedContextProvider,L4:()=>useSelectScopedContext,Mz:()=>SelectHeadingContext,hP:()=>useSelectContext,oZ:()=>useSelectProviderContext,uf:()=>SelectItemCheckedContext});var _WENSINUV_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/WENSINUV.js"),_54MGSIOI_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/54MGSIOI.js"),_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HKOOKEDE.js"),react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),ctx=(0,_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__.B0)([_54MGSIOI_js__WEBPACK_IMPORTED_MODULE_2__.wf,_WENSINUV_js__WEBPACK_IMPORTED_MODULE_3__.ws],[_54MGSIOI_js__WEBPACK_IMPORTED_MODULE_2__.s1,_WENSINUV_js__WEBPACK_IMPORTED_MODULE_3__.aN]),useSelectContext=ctx.useContext,useSelectScopedContext=ctx.useScopedContext,useSelectProviderContext=ctx.useProviderContext,SelectScopedContextProvider=(ctx.ContextProvider,ctx.ScopedContextProvider),SelectItemCheckedContext=(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(!1),SelectHeadingContext=(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(null)},"./packages/components/node_modules/@ariakit/react-core/esm/__chunks/TNITL632.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Cr:()=>TabScopedContextProvider,M_:()=>useTabScopedContext,np:()=>useTabProviderContext});var _WENSINUV_js__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/WENSINUV.js"),ctx=(0,__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HKOOKEDE.js").B0)([_WENSINUV_js__WEBPACK_IMPORTED_MODULE_1__.ws],[_WENSINUV_js__WEBPACK_IMPORTED_MODULE_1__.aN]),useTabScopedContext=(ctx.useContext,ctx.useScopedContext),useTabProviderContext=ctx.useProviderContext,TabScopedContextProvider=(ctx.ContextProvider,ctx.ScopedContextProvider)},"./packages/components/node_modules/@ariakit/react-core/esm/tab/tab-list.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{w:()=>TabList});var _chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/TNITL632.js"),_chunks_TW35PKTK_js__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/TW35PKTK.js"),_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HKOOKEDE.js"),_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/Z32BISHQ.js"),_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/3YLGPPWQ.js"),_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/PBFD2E7P.js"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/jsx-runtime.js"),useTabList=(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__.ab)((function useTabList2(_a){var _b=_a,{store}=_b,props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_2__.YG)(_b,["store"]);const context=(0,_chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_3__.np)();store=store||context,(0,_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_4__.V1)(store,!1);const orientation=store.useState((state=>"both"===state.orientation?void 0:state.orientation));return props=(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_5__.w7)(props,(element=>(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_3__.Cr,{value:store,children:element})),[store]),store.composite&&(props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_2__.IA)({focusable:!1},props)),props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_2__.IA)({role:"tablist","aria-orientation":orientation},props),props=(0,_chunks_TW35PKTK_js__WEBPACK_IMPORTED_MODULE_6__.T)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_2__.IA)({store},props))})),TabList=(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__.Rf)((function TabList2(props){const htmlProps=useTabList(props);return(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_1__.n)("div",htmlProps)}))},"./packages/components/node_modules/@ariakit/react-core/esm/tab/tab-panel.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{K:()=>TabPanel});var _chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/TNITL632.js"),_chunks_PLQDTVXM_js__WEBPACK_IMPORTED_MODULE_12__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/PLQDTVXM.js"),_chunks_BSEL4YAF_js__WEBPACK_IMPORTED_MODULE_11__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/BSEL4YAF.js"),_chunks_HGZKAGPL_js__WEBPACK_IMPORTED_MODULE_10__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HGZKAGPL.js"),_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HKOOKEDE.js"),_chunks_KGK2TTFO_js__WEBPACK_IMPORTED_MODULE_9__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/KGK2TTFO.js"),_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/Z32BISHQ.js"),_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/3YLGPPWQ.js"),_ariakit_core_tab_tab_store__WEBPACK_IMPORTED_MODULE_8__=__webpack_require__("./node_modules/@ariakit/core/esm/tab/tab-store.js"),_ariakit_core_utils_focus__WEBPACK_IMPORTED_MODULE_7__=__webpack_require__("./node_modules/@ariakit/core/esm/utils/focus.js"),_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/PBFD2E7P.js"),react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/react/jsx-runtime.js"),useTabPanel=(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.ab)((function useTabPanel2(_a){var _b=_a,{store,unmountOnHide,tabId:tabIdProp,getItem:getItemProp}=_b,props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.YG)(_b,["store","unmountOnHide","tabId","getItem"]);const context=(0,_chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_4__.np)();store=store||context,(0,_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_5__.V1)(store,!1);const ref=(0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null),id=(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__.Bi)(props.id),[hasTabbableChildren,setHasTabbableChildren]=(0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(!1);(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)((()=>{const element=ref.current;if(!element)return;const tabbable=(0,_ariakit_core_utils_focus__WEBPACK_IMPORTED_MODULE_7__.a9)(element);setHasTabbableChildren(!!tabbable.length)}),[]);const getItem=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((item=>{const nextItem=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},item),{id:id||item.id,tabId:tabIdProp});return getItemProp?getItemProp(nextItem):nextItem}),[id,tabIdProp,getItemProp]),onKeyDownProp=props.onKeyDown,onKeyDown=(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__._q)((event=>{if(null==onKeyDownProp||onKeyDownProp(event),event.defaultPrevented)return;if(!(null==store?void 0:store.composite))return;const state=store.getState(),tab=(0,_ariakit_core_tab_tab_store__WEBPACK_IMPORTED_MODULE_8__.p)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},state),{activeId:state.selectedId}));tab.setState("renderedItems",state.renderedItems);const action={ArrowLeft:tab.previous,ArrowRight:tab.next,Home:tab.first,End:tab.last}[event.key];if(!action)return;const nextId=action();nextId&&(event.preventDefault(),store.move(nextId))}));props=(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__.w7)(props,(element=>(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_4__.Cr,{value:store,children:element})),[store]);const tabId=store.panels.useState((()=>{var _a2;return tabIdProp||(null==(_a2=null==store?void 0:store.panels.item(id))?void 0:_a2.tabId)})),open=store.useState((state=>!!tabId&&state.selectedId===tabId)),disclosure=(0,_chunks_KGK2TTFO_js__WEBPACK_IMPORTED_MODULE_9__.E)({open}),mounted=disclosure.useState("mounted");return props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({id,role:"tabpanel","aria-labelledby":tabId||void 0},props),{children:unmountOnHide&&!mounted?null:props.children,ref:(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__.SV)(ref,props.ref),onKeyDown}),props=(0,_chunks_HGZKAGPL_js__WEBPACK_IMPORTED_MODULE_10__.W)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({focusable:!store.composite&&!hasTabbableChildren},props)),props=(0,_chunks_BSEL4YAF_js__WEBPACK_IMPORTED_MODULE_11__.aT)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({store:disclosure},props)),props=(0,_chunks_PLQDTVXM_js__WEBPACK_IMPORTED_MODULE_12__.v)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({store:store.panels},props),{getItem}))})),TabPanel=(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.Rf)((function TabPanel2(props){const htmlProps=useTabPanel(props);return(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.n)("div",htmlProps)}))},"./packages/components/node_modules/@ariakit/react-core/esm/tab/tab.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{o:()=>Tab});var _chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/TNITL632.js"),_chunks_3CCTMYB6_js__WEBPACK_IMPORTED_MODULE_8__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/3CCTMYB6.js"),_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/HKOOKEDE.js"),_chunks_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_7__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/2GXGCHW6.js"),_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/Z32BISHQ.js"),_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/node_modules/@ariakit/react-core/esm/__chunks/3YLGPPWQ.js"),_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./node_modules/@ariakit/core/esm/__chunks/PBFD2E7P.js"),react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/react/jsx-runtime.js"),useTab=(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.ab)((function useTab2(_a){var _a2,_b=_a,{store,getItem:getItemProp}=_b,props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.YG)(_b,["store","getItem"]);const context=(0,_chunks_TNITL632_js__WEBPACK_IMPORTED_MODULE_4__.M_)();store=store||context,(0,_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_5__.V1)(store,!1);const defaultId=(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__.Bi)(),id=props.id||defaultId,dimmed=(0,_ariakit_core_utils_misc__WEBPACK_IMPORTED_MODULE_5__.$f)(props),getItem=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((item=>{const nextItem=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},item),{dimmed});return getItemProp?getItemProp(nextItem):nextItem}),[dimmed,getItemProp]),onClickProp=props.onClick,onClick=(0,_chunks_Z32BISHQ_js__WEBPACK_IMPORTED_MODULE_6__._q)((event=>{null==onClickProp||onClickProp(event),event.defaultPrevented||null==store||store.setSelectedId(id)})),panelId=store.panels.useState((state=>{var _a3;return null==(_a3=state.items.find((item=>item.tabId===id)))?void 0:_a3.id})),shouldRegisterItem=!!defaultId&&props.shouldRegisterItem,isActive=store.useState((state=>!!id&&state.activeId===id)),selected=store.useState((state=>!!id&&state.selectedId===id)),hasActiveItem=store.useState((state=>!!store.item(state.activeId))),canRegisterComposedItem=isActive||selected&&!hasActiveItem,accessibleWhenDisabled=selected||null==(_a2=props.accessibleWhenDisabled)||_a2;if((0,_chunks_2GXGCHW6_js__WEBPACK_IMPORTED_MODULE_7__.O$)(store.combobox||store.composite,"virtualFocus")&&(props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},props),{tabIndex:-1})),props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({id,role:"tab","aria-selected":selected,"aria-controls":panelId||void 0},props),{onClick}),store.composite){const defaultProps={id,accessibleWhenDisabled,store:store.composite,shouldRegisterItem:canRegisterComposedItem&&shouldRegisterItem,render:props.render};props=(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},props),{render:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_chunks_3CCTMYB6_js__WEBPACK_IMPORTED_MODULE_8__.l,(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},defaultProps),{render:store.combobox&&store.composite!==store.combobox?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_chunks_3CCTMYB6_js__WEBPACK_IMPORTED_MODULE_8__.l,(0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({},defaultProps),{store:store.combobox})):defaultProps.render}))})}return props=(0,_chunks_3CCTMYB6_js__WEBPACK_IMPORTED_MODULE_8__.k)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.ko)((0,_chunks_3YLGPPWQ_js__WEBPACK_IMPORTED_MODULE_3__.IA)({store},props),{accessibleWhenDisabled,getItem,shouldRegisterItem}))})),Tab=(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.ph)((0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.Rf)((function Tab2(props){const htmlProps=useTab(props);return(0,_chunks_HKOOKEDE_js__WEBPACK_IMPORTED_MODULE_2__.n)("button",htmlProps)})))}}]);