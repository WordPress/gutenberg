"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[6644],{"./packages/compose/build-module/hooks/use-dialog/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>__WEBPACK_DEFAULT_EXPORT__});var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),_wordpress_keycodes__WEBPACK_IMPORTED_MODULE_5__=__webpack_require__("./packages/keycodes/build-module/index.js"),_use_constrained_tabbing__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/compose/build-module/hooks/use-constrained-tabbing/index.js"),_use_focus_on_mount__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/compose/build-module/hooks/use-focus-on-mount/index.js"),_use_focus_return__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/compose/build-module/hooks/use-focus-return/index.js"),_use_focus_outside__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./packages/compose/build-module/hooks/use-focus-outside/index.js"),_use_merge_refs__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("./packages/compose/build-module/hooks/use-merge-refs/index.js");const __WEBPACK_DEFAULT_EXPORT__=function useDialog(options){const currentOptions=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(),{constrainTabbing=!1!==options.focusOnMount}=options;(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)((()=>{currentOptions.current=options}),Object.values(options));const constrainedTabbingRef=(0,_use_constrained_tabbing__WEBPACK_IMPORTED_MODULE_1__.A)(),focusOnMountRef=(0,_use_focus_on_mount__WEBPACK_IMPORTED_MODULE_2__.A)(options.focusOnMount),focusReturnRef=(0,_use_focus_return__WEBPACK_IMPORTED_MODULE_3__.A)(),focusOutsideProps=(0,_use_focus_outside__WEBPACK_IMPORTED_MODULE_4__.A)((event=>{currentOptions.current?.__unstableOnClose?currentOptions.current.__unstableOnClose("focus-outside",event):currentOptions.current?.onClose&&currentOptions.current.onClose()})),closeOnEscapeRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((node=>{node&&node.addEventListener("keydown",(event=>{event.keyCode===_wordpress_keycodes__WEBPACK_IMPORTED_MODULE_5__._f&&!event.defaultPrevented&&currentOptions.current?.onClose&&(event.preventDefault(),currentOptions.current.onClose())}))}),[]);return[(0,_use_merge_refs__WEBPACK_IMPORTED_MODULE_6__.A)([constrainTabbing?constrainedTabbingRef:null,!1!==options.focusOnMount?focusReturnRef:null,!1!==options.focusOnMount?focusOnMountRef:null,closeOnEscapeRef]),{...focusOutsideProps,tabIndex:-1}]}},"./packages/compose/build-module/hooks/use-focus-outside/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>useFocusOutside});var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js");const INPUT_BUTTON_TYPES=["button","submit"];function useFocusOutside(onFocusOutside){const currentOnFocusOutsideRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(onFocusOutside);(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)((()=>{currentOnFocusOutsideRef.current=onFocusOutside}),[onFocusOutside]);const preventBlurCheckRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(!1),blurCheckTimeoutIdRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(),cancelBlurCheck=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((()=>{clearTimeout(blurCheckTimeoutIdRef.current)}),[]);(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)((()=>()=>cancelBlurCheck()),[]),(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)((()=>{onFocusOutside||cancelBlurCheck()}),[onFocusOutside,cancelBlurCheck]);const normalizeButtonFocus=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event=>{const{type,target}=event;["mouseup","touchend"].includes(type)?preventBlurCheckRef.current=!1:function isFocusNormalizedButton(eventTarget){if(!(eventTarget instanceof window.HTMLElement))return!1;switch(eventTarget.nodeName){case"A":case"BUTTON":return!0;case"INPUT":return INPUT_BUTTON_TYPES.includes(eventTarget.type)}return!1}(target)&&(preventBlurCheckRef.current=!0)}),[]),queueBlurCheck=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event=>{if(event.persist(),preventBlurCheckRef.current)return;const ignoreForRelatedTarget=event.target.getAttribute("data-unstable-ignore-focus-outside-for-relatedtarget");ignoreForRelatedTarget&&event.relatedTarget?.closest(ignoreForRelatedTarget)||(blurCheckTimeoutIdRef.current=setTimeout((()=>{document.hasFocus()?"function"==typeof currentOnFocusOutsideRef.current&&currentOnFocusOutsideRef.current(event):event.preventDefault()}),0))}),[]);return{onFocus:cancelBlurCheck,onMouseDown:normalizeButtonFocus,onMouseUp:normalizeButtonFocus,onTouchStart:normalizeButtonFocus,onTouchEnd:normalizeButtonFocus,onBlur:queueBlurCheck}}},"./packages/compose/build-module/hooks/use-observable-value/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>useObservableValue});var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js");function useObservableValue(map,name){const[subscribe,getValue]=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)((()=>[listener=>map.subscribe(name,listener),()=>map.get(name)]),[map,name]);return(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useSyncExternalStore)(subscribe,getValue,getValue)}},"./packages/compose/build-module/hooks/use-viewport-match/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>__WEBPACK_DEFAULT_EXPORT__});var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js"),_use_media_query__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/compose/build-module/hooks/use-media-query/index.js");const BREAKPOINTS={xhuge:1920,huge:1440,wide:1280,xlarge:1080,large:960,medium:782,small:600,mobile:480},CONDITIONS={">=":"min-width","<":"max-width"},OPERATOR_EVALUATORS={">=":(breakpointValue,width)=>width>=breakpointValue,"<":(breakpointValue,width)=>width<breakpointValue},ViewportMatchWidthContext=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createContext)(null),useViewportMatch=(breakpoint,operator=">=")=>{const simulatedWidth=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useContext)(ViewportMatchWidthContext),mediaQuery=!simulatedWidth&&`(${CONDITIONS[operator]}: ${BREAKPOINTS[breakpoint]}px)`,mediaQueryResult=(0,_use_media_query__WEBPACK_IMPORTED_MODULE_1__.A)(mediaQuery||void 0);return simulatedWidth?OPERATOR_EVALUATORS[operator](BREAKPOINTS[breakpoint],simulatedWidth):mediaQueryResult};useViewportMatch.__experimentalWidthProvider=ViewportMatchWidthContext.Provider;const __WEBPACK_DEFAULT_EXPORT__=useViewportMatch},"./packages/compose/build-module/utils/observable-map/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function observableMap(){const map=new Map,listeners=new Map;function callListeners(name){const list=listeners.get(name);if(list)for(const listener of list)listener()}return{get:name=>map.get(name),set(name,value){map.set(name,value),callListeners(name)},delete(name){map.delete(name),callListeners(name)},subscribe(name,listener){let list=listeners.get(name);return list||(list=new Set,listeners.set(name,list)),list.add(listener),()=>{list.delete(listener),0===list.size&&listeners.delete(name)}}}}__webpack_require__.d(__webpack_exports__,{u:()=>observableMap})},"./packages/element/build-module/utils.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{s:()=>isEmptyElement});const isEmptyElement=element=>"number"!=typeof element&&("string"==typeof element?.valueOf()||Array.isArray(element)?!element.length:!element)},"./packages/is-shallow-equal/build-module/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Ay:()=>isShallowEqual});var objects=__webpack_require__("./packages/is-shallow-equal/build-module/objects.js");function isShallowEqual(a,b){if(a&&b){if(a.constructor===Object&&b.constructor===Object)return(0,objects.A)(a,b);if(Array.isArray(a)&&Array.isArray(b))return function isShallowEqualArrays(a,b){if(a===b)return!0;if(a.length!==b.length)return!1;for(let i=0,len=a.length;i<len;i++)if(a[i]!==b[i])return!1;return!0}(a,b)}return a===b}},"./packages/is-shallow-equal/build-module/objects.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function isShallowEqualObjects(a,b){if(a===b)return!0;const aKeys=Object.keys(a),bKeys=Object.keys(b);if(aKeys.length!==bKeys.length)return!1;let i=0;for(;i<aKeys.length;){const key=aKeys[i],aValue=a[key];if(void 0===aValue&&!b.hasOwnProperty(key)||aValue!==b[key])return!1;i++}return!0}__webpack_require__.d(__webpack_exports__,{A:()=>isShallowEqualObjects})},"./packages/keycodes/build-module/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{EN:()=>F10,Fm:()=>ENTER,G_:()=>BACKSPACE,JF:()=>rawShortcut,Kp:()=>END,M3:()=>LEFT,NS:()=>RIGHT,Nx:()=>PAGEUP,PX:()=>DOWN,SJ:()=>DELETE,UP:()=>UP,W3:()=>PAGEDOWN,_A:()=>shortcutAriaLabel,_f:()=>ESCAPE,b:()=>displayShortcutList,dz:()=>displayShortcut,kx:()=>isKeyboardEvent,t6:()=>SPACE,wn:()=>TAB,yZ:()=>HOME});var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./packages/i18n/build-module/index.js"),_platform__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/keycodes/build-module/platform.js");const BACKSPACE=8,TAB=9,ENTER=13,ESCAPE=27,SPACE=32,PAGEUP=33,PAGEDOWN=34,END=35,HOME=36,LEFT=37,UP=38,RIGHT=39,DOWN=40,DELETE=46,F10=121,ALT="alt",CTRL="ctrl",COMMAND="meta",SHIFT="shift";function capitaliseFirstCharacter(string){return string.length<2?string.toUpperCase():string.charAt(0).toUpperCase()+string.slice(1)}function mapValues(object,mapFn){return Object.fromEntries(Object.entries(object).map((([key,value])=>[key,mapFn(value)])))}const modifiers={primary:_isApple=>_isApple()?[COMMAND]:[CTRL],primaryShift:_isApple=>_isApple()?[SHIFT,COMMAND]:[CTRL,SHIFT],primaryAlt:_isApple=>_isApple()?[ALT,COMMAND]:[CTRL,ALT],secondary:_isApple=>_isApple()?[SHIFT,ALT,COMMAND]:[CTRL,SHIFT,ALT],access:_isApple=>_isApple()?[CTRL,ALT]:[SHIFT,ALT],ctrl:()=>[CTRL],alt:()=>[ALT],ctrlShift:()=>[CTRL,SHIFT],shift:()=>[SHIFT],shiftAlt:()=>[SHIFT,ALT],undefined:()=>[]},rawShortcut=mapValues(modifiers,(modifier=>(character,_isApple=_platform__WEBPACK_IMPORTED_MODULE_1__.H)=>[...modifier(_isApple),character.toLowerCase()].join("+"))),displayShortcutList=mapValues(modifiers,(modifier=>(character,_isApple=_platform__WEBPACK_IMPORTED_MODULE_1__.H)=>{const isApple=_isApple(),replacementKeyMap={[ALT]:isApple?"⌥":"Alt",[CTRL]:isApple?"⌃":"Ctrl",[COMMAND]:"⌘",[SHIFT]:isApple?"⇧":"Shift"};return[...modifier(_isApple).reduce(((accumulator,key)=>{var _replacementKeyMap$ke;const replacementKey=null!==(_replacementKeyMap$ke=replacementKeyMap[key])&&void 0!==_replacementKeyMap$ke?_replacementKeyMap$ke:key;return isApple?[...accumulator,replacementKey]:[...accumulator,replacementKey,"+"]}),[]),capitaliseFirstCharacter(character)]})),displayShortcut=mapValues(displayShortcutList,(shortcutList=>(character,_isApple=_platform__WEBPACK_IMPORTED_MODULE_1__.H)=>shortcutList(character,_isApple).join(""))),shortcutAriaLabel=mapValues(modifiers,(modifier=>(character,_isApple=_platform__WEBPACK_IMPORTED_MODULE_1__.H)=>{const isApple=_isApple(),replacementKeyMap={[SHIFT]:"Shift",[COMMAND]:isApple?"Command":"Control",[CTRL]:"Control",[ALT]:isApple?"Option":"Alt",",":(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)("Comma"),".":(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)("Period"),"`":(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)("Backtick"),"~":(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)("Tilde")};return[...modifier(_isApple),character].map((key=>{var _replacementKeyMap$ke2;return capitaliseFirstCharacter(null!==(_replacementKeyMap$ke2=replacementKeyMap[key])&&void 0!==_replacementKeyMap$ke2?_replacementKeyMap$ke2:key)})).join(isApple?" ":" + ")}));const isKeyboardEvent=mapValues(modifiers,(getModifiers=>(event,character,_isApple=_platform__WEBPACK_IMPORTED_MODULE_1__.H)=>{const mods=getModifiers(_isApple),eventMods=function getEventModifiers(event){return[ALT,CTRL,COMMAND,SHIFT].filter((key=>event[`${key}Key`]))}(event),replacementWithShiftKeyMap={Comma:",",Backslash:"\\",IntlRo:"\\",IntlYen:"\\"},modsDiff=mods.filter((mod=>!eventMods.includes(mod))),eventModsDiff=eventMods.filter((mod=>!mods.includes(mod)));if(modsDiff.length>0||eventModsDiff.length>0)return!1;let key=event.key.toLowerCase();return character?(event.altKey&&1===character.length&&(key=String.fromCharCode(event.keyCode).toLowerCase()),event.shiftKey&&1===character.length&&replacementWithShiftKeyMap[event.code]&&(key=replacementWithShiftKeyMap[event.code]),"del"===character&&(character="delete"),key===character.toLowerCase()):mods.includes(key)}))},"./packages/keycodes/build-module/platform.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function isAppleOS(_window=null){if(!_window){if("undefined"==typeof window)return!1;_window=window}const{platform}=_window.navigator;return-1!==platform.indexOf("Mac")||["iPad","iPhone"].includes(platform)}__webpack_require__.d(__webpack_exports__,{H:()=>isAppleOS})}}]);