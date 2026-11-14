import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-instance-id-DuzD68j8.js";import{n as o,t as s}from"./build-module-CqL0UdL5.js";import{a as c,i as l}from"./iframe-tpt13bDd.js";import{gn as u,n as d}from"./build-module-D7uZ1UZL.js";import{n as f}from"./use-enable-wp-compat-overlay-slot-C5yFNgiJ.js";import{n as p,t as m}from"./select-control-DDCnyWcU.js";import{n as h,t as g}from"./component-DZpnKgPJ.js";import{n as _,t as ee}from"./component-BTc9NJqK.js";import{n as v,t as y}from"./component-D57p1AT4.js";import{n as b,t as x}from"./component-BPnZ6ikq.js";import{n as S,t as C}from"./component-DkuWgDf5.js";import{n as w,t as T}from"./base-control-Cba0gW66.js";import{n as E,t as D}from"./button-DQ8QTzQz.js";import{i as O,r as k}from"./component-CnSHSW5m.js";import{n as A,t as j}from"./component-DhVmSotl.js";import{n as M,t as te}from"./range-control-CNzDH25X.js";import{a as ne,n as re,o as ie,t as ae}from"./unit-control-ye3c7FQS.js";var N,P,F;function init_style_module(){return(init_style_module=e((()=>{N=`_container_a3lwk_1`,P=`_header_a3lwk_8`,F={container:N,header:P,"header-toggle":`_header-toggle_a3lwk_12`,"header-label":`_header-label_a3lwk_16`,"selected-hint":`_selected-hint_a3lwk_23`}})))()}function isSimpleCssValue(e){return/^[\d\.]+(px|em|rem|vw|vh|%|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax|cqw|cqh|cqi|cqb|cqmin|cqmax)?$/i.test(String(e))}function generateFontSizeHint(e){if(e.hint)return e.hint;if(isSimpleCssValue(e.size))return String(e.size)}var I,L,FontSizePickerSelect;function init_font_size_picker_select(){return(init_font_size_picker_select=e((()=>{s(),a(),p(),h(),init_style_module(),I=t(),L={value:null,label:o(`Default`)},FontSizePickerSelect=e=>{let{fontSizes:t,value:n,valueMode:r=`literal`,onChange:a}=e;f();let s=i(FontSizePickerSelect,`font-size-picker__description`),c=[L,...t.map(e=>({value:e.slug,label:e.name||e.slug,size:e.size,description:generateFontSizeHint(e)}))],l=(()=>{if(n===void 0)return L;if(r===`slug`){let e=c.find(e=>e.value===n);if(e)return e}return c.find(e=>e.size===n)??L})();return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(m,{className:`components-font-size-picker__select`,label:o(`Font size`),hideLabelFromVision:!0,items:c,value:l,popupWidth:`anchor`,trigger:(0,I.jsx)(m.Trigger,{"aria-describedby":s,children:e=>(0,I.jsxs)(I.Fragment,{children:[e.label,e.description&&(0,I.jsx)(`span`,{className:F[`selected-hint`],"aria-hidden":`true`,children:e.description})]})}),onValueChange:e=>{if(e?.value===l.value&&(e?.value!==null||n===void 0))return;let r=t.find(t=>t.slug===e?.value);a(r?.size,r)}}),(0,I.jsx)(g,{id:s,children:l.description})]})};try{FontSizePickerSelect.__docgenInfo={description:``,displayName:`fontsizepickerselect`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/font-size-picker-select.tsx`,methods:[],props:{value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`The current font size value.

Note: For the \`units\` property to work, the current font size value must be specified
as strings with units (e.g., '12px' instead of 12). When the font size is provided
as a number, the component operates in "unitless mode" where the \`units\` property has no effect.`,name:`value`,required:!1,tags:{},type:{name:`string | number`}},valueMode:{defaultValue:{value:`'literal'`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"Determines how the `value` prop should be interpreted.\n- `'literal'`: The `value` prop contains the actual font size value (number or string)\n- `'slug'`: The `value` prop contains the slug of the selected font size",name:`valueMode`,required:!1,tags:{},type:{name:`enum`,raw:`"slug" | "literal"`,value:[{value:`"slug"`},{value:`"literal"`}]}},fontSizes:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:``,name:`fontSizes`,required:!0,tags:{},type:{name:`FontSize[]`}},disableCustomFontSizes:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:``,name:`disableCustomFontSizes`,required:!0,tags:{},type:{name:`NonNullable<boolean | undefined>`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:``,name:`onChange`,required:!0,tags:{},type:{name:`(value: string | number | undefined, selectedItem?: FontSize | undefined) => void`}},onSelectCustom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:``,name:`onSelectCustom`,required:!0,tags:{},type:{name:`() => void`}}},tags:{}}}catch{}})))()}var R,z;function init_constants(){return(init_constants=e((()=>{s(),R=[o(`S`),o(`M`),o(`L`),o(`XL`),o(`XXL`)],z=[o(`Small`),o(`Medium`),o(`Large`),o(`Extra Large`),o(`Extra Extra Large`)]})))()}var B,FontSizePickerToggleGroup;function init_font_size_picker_toggle_group(){return(init_font_size_picker_toggle_group=e((()=>{s(),O(),A(),init_constants(),B=t(),FontSizePickerToggleGroup=e=>{let{fontSizes:t,value:n,valueMode:r=`literal`,onChange:i}=e,a=(()=>{if(n){if(r===`slug`)return String(n);if(!(t.filter(e=>e.size===n).length>1))return t.find(e=>e.size===n)?.slug}})();return(0,B.jsx)(k,{label:o(`Font size`),hideLabelFromVision:!0,value:a,onChange:e=>{if(e===void 0)i(void 0);else{let n=t.find(t=>t.slug===String(e));n&&i(n.size,n)}},isBlock:!0,children:t.map((e,t)=>(0,B.jsx)(j,{value:e.slug,label:R[t],"aria-label":e.name||z[t],showTooltip:!0},e.slug))})};try{FontSizePickerToggleGroup.__docgenInfo={description:``,displayName:`fontsizepickertogglegroup`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/font-size-picker-toggle-group.tsx`,methods:[],props:{value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`The current font size value.

Note: For the \`units\` property to work, the current font size value must be specified
as strings with units (e.g., '12px' instead of 12). When the font size is provided
as a number, the component operates in "unitless mode" where the \`units\` property has no effect.`,name:`value`,required:!1,tags:{},type:{name:`string | number`}},valueMode:{defaultValue:{value:`'literal'`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"Determines how the `value` prop should be interpreted.\n- `'literal'`: The `value` prop contains the actual font size value (number or string)\n- `'slug'`: The `value` prop contains the slug of the selected font size",name:`valueMode`,required:!1,tags:{},type:{name:`enum`,raw:`"slug" | "literal"`,value:[{value:`"slug"`},{value:`"literal"`}]}},fontSizes:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:``,name:`fontSizes`,required:!0,tags:{},type:{name:`FontSize[]`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:``,name:`onChange`,required:!0,tags:{},type:{name:`(value: string | number | undefined, selectedItem?: FontSize | undefined) => void`}}},tags:{}}}catch{}})))()}var V,H,U,UnforwardedFontSizePicker,W;function init_font_size_picker(){return(init_font_size_picker=e((()=>{c(),s(),d(),n(),a(),E(),M(),_(),v(),re(),w(),b(),init_style_module(),S(),init_font_size_picker_select(),init_font_size_picker_toggle_group(),V=t(),H=[`px`,`em`,`rem`,`vw`,`vh`],U=5,UnforwardedFontSizePicker=(e,t)=>{let{fallbackFontSize:n,fontSizes:a=[],disableCustomFontSizes:s=!1,onChange:c,units:d=H,value:f,valueMode:p=`literal`,withSlider:m=!1,withReset:h=!0}=e,g=i(UnforwardedFontSizePicker,`font-size-picker-label`),_=ie({availableUnits:d}),v=(()=>{if(f)return p===`slug`?a.find(e=>e.slug===f):a.find(e=>e.size===f)})(),[b,S]=(0,r.useState)(!!f&&!v),w=p===`slug`?v?.size:f,E;if(E=!s&&b?`custom`:a.length>U?`select`:`togglegroup`,a.length===0&&s)return null;let O=typeof w==`string`||typeof a[0]?.size==`string`,[k,A]=ne(w,_),j=!!A&&[`em`,`rem`,`vw`,`vh`].includes(A),M=f===void 0;return(0,V.jsxs)(`fieldset`,{ref:t,className:l(`components-font-size-picker`,F.container),"aria-labelledby":g,children:[(0,V.jsx)(C,{children:(0,V.jsxs)(x,{className:l(`components-font-size-picker__header`,F.header),children:[(0,V.jsx)(T.VisualLabel,{id:g,className:F[`header-label`],children:o(`Font size`)}),!s&&(0,V.jsx)(D,{className:F[`header-toggle`],label:o(E===`custom`?`Use size preset`:`Set custom size`),icon:u,onClick:()=>S(!b),isPressed:E===`custom`,size:`small`})]})}),(0,V.jsxs)(`div`,{children:[E===`select`&&(0,V.jsx)(FontSizePickerSelect,{fontSizes:a,value:f,valueMode:p,disableCustomFontSizes:s,onChange:(e,t)=>{e===void 0?c?.(void 0,t):c?.(O?e:Number(e),t)},onSelectCustom:()=>S(!0)}),E===`togglegroup`&&(0,V.jsx)(FontSizePickerToggleGroup,{fontSizes:a,value:f,valueMode:p,onChange:(e,t)=>{e===void 0?c?.(void 0,t):c?.(O?e:Number(e),t)}}),E===`custom`&&(0,V.jsxs)(ee,{className:`components-font-size-picker__custom-size-control`,children:[(0,V.jsx)(y,{isBlock:!0,children:(0,V.jsx)(ae,{label:o(`Font size`),labelPosition:`top`,hideLabelFromVision:!0,value:O?`${k??``}${A??``}`:w,onChange:e=>{S(!0),e===void 0||e===``?c?.(void 0):c?.(O?e:parseInt(e,10))},units:O?_:[],min:0,step:O?void 0:1})}),m&&(0,V.jsx)(y,{isBlock:!0,children:(0,V.jsx)(C,{marginX:2,marginBottom:0,children:(0,V.jsx)(te,{className:`components-font-size-picker__custom-input`,label:o(`Font size`),hideLabelFromVision:!0,value:k,initialPosition:n,withInputField:!1,onChange:e=>{S(!0),e===void 0?c?.(void 0):O?c?.(e+(A??`px`)):c?.(e)},min:0,max:j?10:100,step:j?.1:1})})}),h&&(0,V.jsx)(y,{children:(0,V.jsx)(D,{disabled:M,accessibleWhenDisabled:!0,onClick:()=>{c?.(void 0)},variant:`secondary`,__next40pxDefaultSize:!0,size:`default`,children:o(`Reset`)})})]})]})]})},W=(0,r.forwardRef)(UnforwardedFontSizePicker),W.displayName=`FontSizePicker`;try{W.__docgenInfo={description:``,displayName:`FontSizePicker`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/index.tsx`,methods:[],props:{size:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:`The size variant of the control.
@deprecated This prop no longer has any effect.
@ignore`,name:`size`,required:!1,tags:{},type:{name:`enum`,raw:`"default" | "__unstable-large"`,value:[{value:`"default"`},{value:`"__unstable-large"`}]}},__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the default size in a future version.
@deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},disableCustomFontSizes:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"If `true`, it will not be possible to choose a custom fontSize. The user\nwill be forced to pick one of the pre-defined sizes passed in fontSizes.",name:`disableCustomFontSizes`,required:!1,tags:{},type:{name:`boolean`}},fallbackFontSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"If no value exists, this prop defines the starting position for the font\nsize picker slider. Only relevant if `withSlider` is `true`.",name:`fallbackFontSize`,required:!1,tags:{},type:{name:`number`}},fontSizes:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`An array of font size objects. The object should contain properties size,
name, and slug.`,name:`fontSizes`,required:!1,tags:{},type:{name:`FontSize[]`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new font size value.
If onChange is called without any parameter, it should reset the value,
attending to what reset means in that context, e.g., set the font size to
undefined or set the font size a starting value.`,name:`onChange`,required:!1,tags:{},type:{name:`((value: string | number, selectedItem?: FontSize) => void) | undefined`}},units:{defaultValue:{value:`[ 'px', 'em', 'rem', 'vw', 'vh' ]`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`Available units for custom font size selection.`,name:`units`,required:!1,tags:{},type:{name:`string[]`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`The current font size value.

Note: For the \`units\` property to work, the current font size value must be specified
as strings with units (e.g., '12px' instead of 12). When the font size is provided
as a number, the component operates in "unitless mode" where the \`units\` property has no effect.`,name:`value`,required:!1,tags:{},type:{name:`string | number`}},valueMode:{defaultValue:{value:`'literal'`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"Determines how the `value` prop should be interpreted.\n- `'literal'`: The `value` prop contains the actual font size value (number or string)\n- `'slug'`: The `value` prop contains the slug of the selected font size",name:`valueMode`,required:!1,tags:{},type:{name:`enum`,raw:`"slug" | "literal"`,value:[{value:`"slug"`},{value:`"literal"`}]}},withSlider:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"If `true`, a slider will be displayed alongside the input field when a\ncustom font size is active. Has no effect when `disableCustomFontSizes`\nis `true`.",name:`withSlider`,required:!1,tags:{},type:{name:`boolean`}},withReset:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:"If `true`, a reset button will be displayed alongside the input field\nwhen a custom font size is active. Has no effect when\n`disableCustomFontSizes` is `true`.",name:`withReset`,required:!1,tags:{},type:{name:`boolean`}},__nextHasNoMarginBottom:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/font-size-picker/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default
in a future version, currently scheduled to be WordPress 6.4. (The prop
can be safely removed once this happens.)
@deprecated Default behavior since WP 6.5. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var G,K,q,FontSizePickerWithState,TwoFontSizePickersWithState,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{n(),init_font_size_picker(),G=t(),{fn:K}=__STORYBOOK_MODULE_TEST__,q={id:`components-fontsizepicker`,title:`Components/@wordpress-components/FontSizePicker`,component:W,argTypes:{value:{control:!1},units:{control:`inline-check`,options:[`px`,`em`,`rem`,`vw`,`vh`]}},args:{onChange:K()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},FontSizePickerWithState=({value:e,onChange:t,...n})=>{let[i,a]=(0,r.useState)(e);return(0,G.jsx)(W,{...n,value:i,onChange:e=>{a(e),t?.(e)}})},TwoFontSizePickersWithState=({fontSizes:e,...t})=>(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`h2`,{children:`Fewer font sizes`}),(0,G.jsx)(FontSizePickerWithState,{...t,fontSizes:e?.slice(0,4)}),(0,G.jsx)(`h2`,{children:`More font sizes`}),(0,G.jsx)(FontSizePickerWithState,{...t,fontSizes:e})]}),J={render:FontSizePickerWithState,args:{disableCustomFontSizes:!1,fontSizes:[{name:`Small`,slug:`small`,size:12},{name:`Normal`,slug:`normal`,size:16},{name:`Big`,slug:`big`,size:26}],value:16,withSlider:!1}},Y={render:FontSizePickerWithState,args:{...J.args,fallbackFontSize:16,value:void 0,withSlider:!0}},X={render:FontSizePickerWithState,args:{...J.args,disableCustomFontSizes:!0}},Z={render:FontSizePickerWithState,args:{...J.args,fontSizes:[{name:`Tiny`,slug:`tiny`,size:8},{name:`Small`,slug:`small`,size:12},{name:`Normal`,slug:`normal`,size:16},{name:`Big`,slug:`big`,size:26},{name:`Bigger`,slug:`bigger`,size:30},{name:`Huge`,slug:`huge`,size:36}],value:8}},Q={render:TwoFontSizePickersWithState,args:{...Z.args,fontSizes:Z.args?.fontSizes?.map(e=>({...e,size:`${e.size}px`})),value:`8px`}},$={render:TwoFontSizePickersWithState,args:{...J.args,fontSizes:[{name:`Small`,slug:`small`,size:`clamp(1.75rem, 3vw, 2.25rem)`},{name:`Medium`,slug:`medium`,size:`1.125rem`},{name:`Large`,slug:`large`,size:`1.7rem`},{name:`Extra Large`,slug:`extra-large`,size:`1.95rem`},{name:`Extra Extra Large`,slug:`extra-extra-large`,size:`2.5rem`},{name:`Huge`,slug:`huge`,size:`2.8rem`}],value:`1.125rem`}};try{X.__docgenInfo={description:"With custom font sizes disabled via the `disableCustomFontSizes` prop, the user will\nonly be able to pick one of the predefined sizes passed in `fontSizes`.",displayName:`WithCustomSizesDisabled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:`When there are more than 5 font size options, the UI is no longer a toggle group.`,displayName:`WithMoreFontSizes`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:"When units like `px` are specified explicitly, it will be shown as a label hint.",displayName:`WithUnits`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:"The label hint will not be shown if it is a complex CSS value. Some examples of complex CSS values\nin this context are CSS functions like `calc()`, `clamp()`, and `var()`.",displayName:`WithComplexCSSValues`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/font-size-picker/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  render: FontSizePickerWithState,
  args: {
    disableCustomFontSizes: false,
    fontSizes: [{
      name: 'Small',
      slug: 'small',
      size: 12
    }, {
      name: 'Normal',
      slug: 'normal',
      size: 16
    }, {
      name: 'Big',
      slug: 'big',
      size: 26
    }],
    value: 16,
    withSlider: false
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  render: FontSizePickerWithState,
  args: {
    ...Default.args,
    fallbackFontSize: 16,
    value: undefined,
    withSlider: true
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  render: FontSizePickerWithState,
  args: {
    ...Default.args,
    disableCustomFontSizes: true
  }
}`,...X.parameters?.docs?.source},description:{story:"With custom font sizes disabled via the `disableCustomFontSizes` prop, the user will\nonly be able to pick one of the predefined sizes passed in `fontSizes`.",...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: FontSizePickerWithState,
  args: {
    ...Default.args,
    fontSizes: [{
      name: 'Tiny',
      slug: 'tiny',
      size: 8
    }, {
      name: 'Small',
      slug: 'small',
      size: 12
    }, {
      name: 'Normal',
      slug: 'normal',
      size: 16
    }, {
      name: 'Big',
      slug: 'big',
      size: 26
    }, {
      name: 'Bigger',
      slug: 'bigger',
      size: 30
    }, {
      name: 'Huge',
      slug: 'huge',
      size: 36
    }],
    value: 8
  }
}`,...Z.parameters?.docs?.source},description:{story:`When there are more than 5 font size options, the UI is no longer a toggle group.`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: TwoFontSizePickersWithState,
  args: {
    ...WithMoreFontSizes.args,
    fontSizes: WithMoreFontSizes.args?.fontSizes?.map(option => ({
      ...option,
      size: \`\${option.size}px\`
    })),
    value: '8px'
  }
}`,...Q.parameters?.docs?.source},description:{story:"When units like `px` are specified explicitly, it will be shown as a label hint.",...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: TwoFontSizePickersWithState,
  args: {
    ...Default.args,
    fontSizes: [{
      name: 'Small',
      slug: 'small',
      // Adding just one complex css value is enough
      size: 'clamp(1.75rem, 3vw, 2.25rem)'
    }, {
      name: 'Medium',
      slug: 'medium',
      size: '1.125rem'
    }, {
      name: 'Large',
      slug: 'large',
      size: '1.7rem'
    }, {
      name: 'Extra Large',
      slug: 'extra-large',
      size: '1.95rem'
    }, {
      name: 'Extra Extra Large',
      slug: 'extra-extra-large',
      size: '2.5rem'
    }, {
      name: 'Huge',
      slug: 'huge',
      size: '2.8rem'
    }],
    value: '1.125rem'
  }
}`,...$.parameters?.docs?.source},description:{story:"The label hint will not be shown if it is a complex CSS value. Some examples of complex CSS values\nin this context are CSS functions like `calc()`, `clamp()`, and `var()`.",...$.parameters?.docs?.description}}}})))()}init_index_story();export{J as Default,$ as WithComplexCSSValues,X as WithCustomSizesDisabled,Z as WithMoreFontSizes,Y as WithSlider,Q as WithUnits,q as default};