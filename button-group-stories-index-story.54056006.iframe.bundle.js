/*! For license information please see button-group-stories-index-story.54056006.iframe.bundle.js.LICENSE.txt */
"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[9074],{"./packages/components/src/button-group/index.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>__WEBPACK_DEFAULT_EXPORT__});var clsx__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/clsx/dist/clsx.mjs"),_wordpress_element__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./node_modules/react/index.js"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/jsx-runtime.js");function UnforwardedButtonGroup(props,ref){const{className,...restProps}=props,classes=(0,clsx__WEBPACK_IMPORTED_MODULE_1__.A)("components-button-group",className);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{ref,role:"group",className:classes,...restProps})}UnforwardedButtonGroup.displayName="UnforwardedButtonGroup";const ButtonGroup=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.forwardRef)(UnforwardedButtonGroup),__WEBPACK_DEFAULT_EXPORT__=ButtonGroup;try{ButtonGroup.displayName="ButtonGroup",ButtonGroup.__docgenInfo={description:'ButtonGroup can be used to group any related buttons together. To emphasize\nrelated buttons, a group should share a common container.\n\n```jsx\nimport { Button, ButtonGroup } from \'@wordpress/components\';\n\nconst MyButtonGroup = () => (\n  <ButtonGroup>\n    <Button variant="primary">Button 1</Button>\n    <Button variant="primary">Button 2</Button>\n  </ButtonGroup>\n);\n```',displayName:"ButtonGroup",props:{children:{defaultValue:null,description:"The children elements.",name:"children",required:!0,type:{name:"ReactNode"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["packages/components/src/button-group/index.tsx#ButtonGroup"]={docgenInfo:ButtonGroup.__docgenInfo,name:"ButtonGroup",path:"packages/components/src/button-group/index.tsx#ButtonGroup"})}catch(__react_docgen_typescript_loader_error){}try{buttongroup.displayName="buttongroup",buttongroup.__docgenInfo={description:'ButtonGroup can be used to group any related buttons together. To emphasize\nrelated buttons, a group should share a common container.\n\n```jsx\nimport { Button, ButtonGroup } from \'@wordpress/components\';\n\nconst MyButtonGroup = () => (\n  <ButtonGroup>\n    <Button variant="primary">Button 1</Button>\n    <Button variant="primary">Button 2</Button>\n  </ButtonGroup>\n);\n```',displayName:"buttongroup",props:{children:{defaultValue:null,description:"The children elements.",name:"children",required:!0,type:{name:"ReactNode"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["packages/components/src/button-group/index.tsx#buttongroup"]={docgenInfo:buttongroup.__docgenInfo,name:"buttongroup",path:"packages/components/src/button-group/index.tsx#buttongroup"})}catch(__react_docgen_typescript_loader_error){}},"./node_modules/deepmerge/dist/cjs.js":module=>{var isMergeableObject=function isMergeableObject(value){return function isNonNullObject(value){return!!value&&"object"==typeof value}(value)&&!function isSpecial(value){var stringValue=Object.prototype.toString.call(value);return"[object RegExp]"===stringValue||"[object Date]"===stringValue||function isReactElement(value){return value.$$typeof===REACT_ELEMENT_TYPE}(value)}(value)};var REACT_ELEMENT_TYPE="function"==typeof Symbol&&Symbol.for?Symbol.for("react.element"):60103;function cloneUnlessOtherwiseSpecified(value,options){return!1!==options.clone&&options.isMergeableObject(value)?deepmerge(function emptyTarget(val){return Array.isArray(val)?[]:{}}(value),value,options):value}function defaultArrayMerge(target,source,options){return target.concat(source).map((function(element){return cloneUnlessOtherwiseSpecified(element,options)}))}function getKeys(target){return Object.keys(target).concat(function getEnumerableOwnPropertySymbols(target){return Object.getOwnPropertySymbols?Object.getOwnPropertySymbols(target).filter((function(symbol){return Object.propertyIsEnumerable.call(target,symbol)})):[]}(target))}function propertyIsOnObject(object,property){try{return property in object}catch(_){return!1}}function mergeObject(target,source,options){var destination={};return options.isMergeableObject(target)&&getKeys(target).forEach((function(key){destination[key]=cloneUnlessOtherwiseSpecified(target[key],options)})),getKeys(source).forEach((function(key){(function propertyIsUnsafe(target,key){return propertyIsOnObject(target,key)&&!(Object.hasOwnProperty.call(target,key)&&Object.propertyIsEnumerable.call(target,key))})(target,key)||(propertyIsOnObject(target,key)&&options.isMergeableObject(source[key])?destination[key]=function getMergeFunction(key,options){if(!options.customMerge)return deepmerge;var customMerge=options.customMerge(key);return"function"==typeof customMerge?customMerge:deepmerge}(key,options)(target[key],source[key],options):destination[key]=cloneUnlessOtherwiseSpecified(source[key],options))})),destination}function deepmerge(target,source,options){(options=options||{}).arrayMerge=options.arrayMerge||defaultArrayMerge,options.isMergeableObject=options.isMergeableObject||isMergeableObject,options.cloneUnlessOtherwiseSpecified=cloneUnlessOtherwiseSpecified;var sourceIsArray=Array.isArray(source);return sourceIsArray===Array.isArray(target)?sourceIsArray?options.arrayMerge(target,source,options):mergeObject(target,source,options):cloneUnlessOtherwiseSpecified(source,options)}deepmerge.all=function deepmergeAll(array,options){if(!Array.isArray(array))throw new Error("first argument should be an array");return array.reduce((function(prev,next){return deepmerge(prev,next,options)}),{})};var deepmerge_1=deepmerge;module.exports=deepmerge_1},"./node_modules/fast-deep-equal/es6/index.js":module=>{module.exports=function equal(a,b){if(a===b)return!0;if(a&&b&&"object"==typeof a&&"object"==typeof b){if(a.constructor!==b.constructor)return!1;var length,i,keys;if(Array.isArray(a)){if((length=a.length)!=b.length)return!1;for(i=length;0!=i--;)if(!equal(a[i],b[i]))return!1;return!0}if(a instanceof Map&&b instanceof Map){if(a.size!==b.size)return!1;for(i of a.entries())if(!b.has(i[0]))return!1;for(i of a.entries())if(!equal(i[1],b.get(i[0])))return!1;return!0}if(a instanceof Set&&b instanceof Set){if(a.size!==b.size)return!1;for(i of a.entries())if(!b.has(i[0]))return!1;return!0}if(ArrayBuffer.isView(a)&&ArrayBuffer.isView(b)){if((length=a.length)!=b.length)return!1;for(i=length;0!=i--;)if(a[i]!==b[i])return!1;return!0}if(a.constructor===RegExp)return a.source===b.source&&a.flags===b.flags;if(a.valueOf!==Object.prototype.valueOf)return a.valueOf()===b.valueOf();if(a.toString!==Object.prototype.toString)return a.toString()===b.toString();if((length=(keys=Object.keys(a)).length)!==Object.keys(b).length)return!1;for(i=length;0!=i--;)if(!Object.prototype.hasOwnProperty.call(b,keys[i]))return!1;for(i=length;0!=i--;){var key=keys[i];if(!equal(a[key],b[key]))return!1}return!0}return a!=a&&b!=b}},"./node_modules/is-plain-object/dist/is-plain-object.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function isObject(o){return"[object Object]"===Object.prototype.toString.call(o)}function isPlainObject(o){var ctor,prot;return!1!==isObject(o)&&(void 0===(ctor=o.constructor)||!1!==isObject(prot=ctor.prototype)&&!1!==prot.hasOwnProperty("isPrototypeOf"))}__webpack_require__.d(__webpack_exports__,{Q:()=>isPlainObject})},"./node_modules/memize/dist/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{function memize(fn,options){var head,tail,size=0;function memoized(){var args,i,node=head,len=arguments.length;searchCache:for(;node;){if(node.args.length===arguments.length){for(i=0;i<len;i++)if(node.args[i]!==arguments[i]){node=node.next;continue searchCache}return node!==head&&(node===tail&&(tail=node.prev),node.prev.next=node.next,node.next&&(node.next.prev=node.prev),node.next=head,node.prev=null,head.prev=node,head=node),node.val}node=node.next}for(args=new Array(len),i=0;i<len;i++)args[i]=arguments[i];return node={args,val:fn.apply(null,args)},head?(head.prev=node,node.next=head):tail=node,size===options.maxSize?(tail=tail.prev).next=null:size++,head=node,node.val}return options=options||{},memoized.clear=function(){head=null,tail=null,size=0},memoized}__webpack_require__.d(__webpack_exports__,{A:()=>memize})},"./packages/components/src/button-group/stories/index.story.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{Default:()=>Default,default:()=>__WEBPACK_DEFAULT_EXPORT__});var ___WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/src/button-group/index.tsx"),_button__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/src/button/index.tsx"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/jsx-runtime.js");const __WEBPACK_DEFAULT_EXPORT__={title:"Components/ButtonGroup",component:___WEBPACK_IMPORTED_MODULE_1__.A,argTypes:{children:{control:{type:null}}},parameters:{sourceLink:"packages/components/src/button-group",badges:[],controls:{expanded:!0},docs:{canvas:{sourceState:"shown"}}}},Default={args:{children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment,{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_button__WEBPACK_IMPORTED_MODULE_2__.Ay,{variant:"primary",children:"Button 1"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_button__WEBPACK_IMPORTED_MODULE_2__.Ay,{children:"Button 2"})]})}};Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:'{\n  args: {\n    children: <>\n                <Button variant="primary">Button 1</Button>\n                <Button>Button 2</Button>\n            </>\n  }\n}',...Default.parameters?.docs?.source}}}}}]);