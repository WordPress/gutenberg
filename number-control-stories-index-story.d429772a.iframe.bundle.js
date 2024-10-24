"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[2471],{"./packages/compose/build-module/hooks/use-merge-refs/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>useMergeRefs});var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js");function assignRef(ref,value){"function"==typeof ref?ref(value):ref&&ref.hasOwnProperty("current")&&(ref.current=value)}function useMergeRefs(refs){const element=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(),isAttachedRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(!1),didElementChangeRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(!1),previousRefsRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)([]),currentRefsRef=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(refs);return currentRefsRef.current=refs,(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect)((()=>{!1===didElementChangeRef.current&&!0===isAttachedRef.current&&refs.forEach(((ref,index)=>{const previousRef=previousRefsRef.current[index];ref!==previousRef&&(assignRef(previousRef,null),assignRef(ref,element.current))})),previousRefsRef.current=refs}),refs),(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect)((()=>{didElementChangeRef.current=!1})),(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((value=>{assignRef(element,value),didElementChangeRef.current=!0,isAttachedRef.current=null!==value;const refsToAssign=value?currentRefsRef.current:previousRefsRef.current;for(const ref of refsToAssign)assignRef(ref,value)}),[])}},"./packages/components/src/number-control/stories/index.story.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{Default:()=>Default,default:()=>__WEBPACK_DEFAULT_EXPORT__});var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./node_modules/react/index.js"),___WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/src/number-control/index.tsx"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/jsx-runtime.js");const __WEBPACK_DEFAULT_EXPORT__={title:"Components (Experimental)/NumberControl",component:___WEBPACK_IMPORTED_MODULE_1__.A,argTypes:{onChange:{action:"onChange"},prefix:{control:{type:"text"}},step:{control:{type:"text"}},suffix:{control:{type:"text"}},type:{control:{type:"text"}},value:{control:null}},parameters:{sourceLink:"packages/components/src/number-control",badges:[],controls:{expanded:!0},docs:{canvas:{sourceState:"shown"}}}},Default=(({onChange,...props})=>{const[value,setValue]=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useState)("0"),[isValidValue,setIsValidValue]=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useState)(!0);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment,{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(___WEBPACK_IMPORTED_MODULE_1__.A,{...props,value,onChange:(v,extra)=>{setValue(v),setIsValidValue(extra.event.target.validity.valid),onChange?.(v,extra)}}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p",{children:["Is valid? ",isValidValue?"Yes":"No"]})]})}).bind({});Default.args={label:"Value"},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:"({\n  onChange,\n  ...props\n}) => {\n  const [value, setValue] = useState<string | undefined>('0');\n  const [isValidValue, setIsValidValue] = useState(true);\n  return <>\n            <NumberControl {...props} value={value} onChange={(v, extra) => {\n      setValue(v);\n      setIsValidValue((extra.event.target as HTMLInputElement).validity.valid);\n      onChange?.(v, extra);\n    }} />\n            <p>Is valid? {isValidValue ? 'Yes' : 'No'}</p>\n        </>;\n}",...Default.parameters?.docs?.source}}}}}]);