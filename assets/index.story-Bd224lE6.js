import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-instance-id-DuzD68j8.js";import{n as o,t as s}from"./use-merge-refs-BNmiIksj.js";import{n as c,t as l}from"./build-module-CqL0UdL5.js";import{a as u,i as d}from"./iframe-y9psNcyg.js";import{Ji as f,Ki as p,n as m}from"./build-module-CPA2Y5FH.js";import{n as h,o as g,r as _,t as v}from"./use-context-system-CiYx-c7e.js";import{n as y,t as b}from"./component-Ct9KQYwf.js";import{n as x,t as S}from"./component-lXS83C_h.js";import{n as C,t as w}from"./base-control-CyYzPRw2.js";import{n as T,t as E}from"./button-8ccnOjTA.js";import{n as D,t as O}from"./component-DawUS__-.js";import{n as k,t as A}from"./component-FEO-g0oC.js";var j,M,N,P;function init_style_module(){return(init_style_module=e((()=>{j=`_header_1wa84_60`,M=`_wrapper_1wa84_74`,N=`_visualizer_1wa84_88`,P={"linked-border-control":`_linked-border-control_1wa84_46`,"linked-border-control-full-width":`_linked-border-control-full-width_1wa84_53`,header:j,wrapper:M,"linked-button":`_linked-button_1wa84_78`,visualizer:N,"split-controls":`_split-controls_1wa84_99`,"centered-border-control":`_centered-border-control_1wa84_104`,"right-border-control":`_right-border-control_1wa84_114`}})))()}function useBorderBoxControlLinkedButton(e){let{className:t,...n}=h(e,`BorderBoxControlLinkedButton`);return{...n,className:d(P[`linked-button`],t)}}function init_hook(){return(init_hook=e((()=>{u(),init_style_module(),v()})))()}var F,BorderBoxControlLinkedButton,I;function init_component(){return(init_component=e((()=>{m(),l(),T(),g(),init_hook(),F=t(),BorderBoxControlLinkedButton=(e,t)=>{let{className:n,isLinked:r,...i}=useBorderBoxControlLinkedButton(e),a=c(r?`Unlink sides`:`Link sides`);return(0,F.jsx)(E,{...i,size:`small`,icon:r?p:f,iconSize:24,label:a,ref:t,className:n})},I=_(BorderBoxControlLinkedButton,`BorderBoxControlLinkedButton`)})))()}function useBorderBoxControlVisualizer(e){let{className:t,style:n,value:r,...i}=h(e,`BorderBoxControlVisualizer`);return{...i,className:d(P.visualizer,t),style:{...n,"--wp-components-border-box-visualizer-top":borderBoxStyleWithFallback(r?.top),"--wp-components-border-box-visualizer-bottom":borderBoxStyleWithFallback(r?.bottom),"--wp-components-border-box-visualizer-start":borderBoxStyleWithFallback(r?.left),"--wp-components-border-box-visualizer-end":borderBoxStyleWithFallback(r?.right)},value:r}}var borderBoxStyleWithFallback;function init_hook$1(){return(init_hook$1=e((()=>{u(),init_style_module(),v(),borderBoxStyleWithFallback=e=>{let{color:t=`var(--wpds-color-stroke-surface-neutral, #dbdbdb)`,style:n=`solid`,width:r=`var(--wpds-border-width-xs, 1px)`}=e||{},i=`clamp(1px, ${r}, 10px)`;return`${t} ${r&&r!==`0`||t?n||`solid`:n} ${i}`}})))()}var L,BorderBoxControlVisualizer,R;function init_component$1(){return(init_component$1=e((()=>{x(),g(),init_hook$1(),L=t(),BorderBoxControlVisualizer=(e,t)=>{let{value:n,...r}=useBorderBoxControlVisualizer(e);return(0,L.jsx)(S,{...r,ref:t})},R=_(BorderBoxControlVisualizer,`BorderBoxControlVisualizer`)})))()}function useBorderBoxControlSplitControls(e){let{className:t,colors:n=[],enableAlpha:r=!1,enableStyle:i=!0,__experimentalIsRenderedInSidebar:a=!1,...o}=h(e,`BorderBoxControlSplitControls`);return{...o,centeredClassName:d(P[`centered-border-control`],t),className:d(P[`split-controls`],t),colors:n,enableAlpha:r,enableStyle:i,rightAlignedClassName:d(P[`right-border-control`],t),__experimentalIsRenderedInSidebar:a}}function init_hook$2(){return(init_hook$2=e((()=>{u(),init_style_module(),v()})))()}var z,BorderBoxControlSplitControls,B;function init_component$2(){return(init_component$2=e((()=>{l(),n(),s(),init_component$1(),D(),k(),g(),init_hook$2(),z=t(),BorderBoxControlSplitControls=(e,t)=>{let{centeredClassName:n,colors:i,disableCustomColors:a,enableAlpha:s,enableStyle:l,onChange:u,popoverPlacement:d,popoverOffset:f,rightAlignedClassName:p,value:m,__experimentalIsRenderedInSidebar:h,...g}=useBorderBoxControlSplitControls(e),[_,v]=(0,r.useState)(null),y=(0,r.useMemo)(()=>d?{placement:d,offset:f,anchor:_,shift:!0}:void 0,[d,f,_]),b={colors:i,disableCustomColors:a,enableAlpha:s,enableStyle:l,isCompact:!0,__experimentalIsRenderedInSidebar:h},x=o([v,t]);return(0,z.jsxs)(A,{...g,ref:x,gap:3,children:[(0,z.jsx)(R,{value:m}),(0,z.jsx)(O,{className:n,hideLabelFromVision:!0,label:c(`Top border`),onChange:e=>u(e,`top`),__unstablePopoverProps:y,value:m?.top,...b}),(0,z.jsx)(O,{hideLabelFromVision:!0,label:c(`Left border`),onChange:e=>u(e,`left`),__unstablePopoverProps:y,value:m?.left,...b}),(0,z.jsx)(O,{className:p,hideLabelFromVision:!0,label:c(`Right border`),onChange:e=>u(e,`right`),__unstablePopoverProps:y,value:m?.right,...b}),(0,z.jsx)(O,{className:n,hideLabelFromVision:!0,label:c(`Bottom border`),onChange:e=>u(e,`bottom`),__unstablePopoverProps:y,value:m?.bottom,...b})]})},B=_(BorderBoxControlSplitControls,`BorderBoxControlSplitControls`)})))()}function parseCSSUnitValue(e){let t=e.trim().match(V);if(!t)return[void 0,void 0];let[,n,r]=t,i=parseFloat(n);return i=Number.isNaN(i)?void 0:i,[i,r]}var V;function init_unit_values(){return(init_unit_values=e((()=>{V=/^([\d.\-+]*)\s*(fr|cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|vw|vh|vmin|vmax|%|cap|ic|rlh|vi|vb|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|svw|lvw|dvw|svh|lvh|dvh|svi|lvi|dvi|svb|lvb|dvb|svmin|lvmin|dvmin|svmax|lvmax|dvmax)?$/})))()}function splitBoxShorthand(e){let t=[],n=``,r=0;for(let i of e.trim())i===`(`?(r++,n+=i):i===`)`?(r=Math.max(0,r-1),n+=i):/\s/.test(i)&&r===0?n&&=(t.push(n),``):n+=i;return n&&t.push(n),t}function unpackBoxShorthand(e){if(typeof e!=`string`)return{top:e,right:e,bottom:e,left:e};let t=splitBoxShorthand(e);switch(t.length){case 2:return{top:t[0],right:t[1],bottom:t[0],left:t[1]};case 3:return{top:t[0],right:t[1],bottom:t[2],left:t[1]};case 4:return{top:t[0],right:t[1],bottom:t[2],left:t[3]};default:return{top:e,right:e,bottom:e,left:e}}}function mode(e){if(e.length===0)return;let t={},n=0,r;return e.forEach(e=>{t[e]=t[e]===void 0?1:t[e]+1,t[e]>n&&(r=e,n=t[e])}),r}var H,U,isEmptyBorder,isCompleteBorder,hasSplitBorders,hasMixedBorders,getSplitBorders,getBorderDiff,getCommonBorder,getShorthandBorderStyle,getMostCommonUnit;function init_utils(){return(init_utils=e((()=>{init_unit_values(),H=[`top`,`right`,`bottom`,`left`],U=[`color`,`style`,`width`],isEmptyBorder=e=>!e||!U.some(t=>e[t]!==void 0),isCompleteBorder=e=>e?U.every(t=>e[t]!==void 0):!1,hasSplitBorders=(e={})=>Object.keys(e).some(e=>H.indexOf(e)!==-1),hasMixedBorders=e=>{if(!hasSplitBorders(e))return!1;let t=H.map(t=>getShorthandBorderStyle(e?.[t]));return!t.every(e=>e===t[0])},getSplitBorders=e=>{if(!e||isEmptyBorder(e))return;if(e.width===void 0)return{top:e,right:e,bottom:e,left:e};let t=unpackBoxShorthand(e.width);return{top:{...e,width:t.top},right:{...e,width:t.right},bottom:{...e,width:t.bottom},left:{...e,width:t.left}}},getBorderDiff=(e,t)=>{let n={};return e.color!==t.color&&(n.color=t.color),e.style!==t.style&&(n.style=t.style),e.width!==t.width&&(n.width=t.width),n},getCommonBorder=e=>{if(!e)return;let t=[],n=[],r=[];H.forEach(i=>{t.push(e[i]?.color),n.push(e[i]?.style),r.push(e[i]?.width)});let i=t.every(e=>e===t[0]),a=n.every(e=>e===n[0]),o=r.every(e=>e===r[0]);return{color:i?t[0]:void 0,style:a?n[0]:void 0,width:o?r[0]:getMostCommonUnit(r)}},getShorthandBorderStyle=(e,t)=>{if(isEmptyBorder(e))return t;let{color:n,style:r,width:i}=t||{},{color:a=n,style:o=r,width:s=i}=e;return[s,s&&s!==`0`||a?o||`solid`:o,a].filter(Boolean).join(` `)},getMostCommonUnit=e=>mode(e.map(e=>e===void 0?void 0:parseCSSUnitValue(`${e}`)[1]).filter(e=>e!==void 0))})))()}function useBorderBoxControl(e){let{className:t,colors:n=[],onChange:i,enableAlpha:a=!1,enableStyle:o=!0,hideLabelFromVision:s,label:c,value:l,__experimentalIsRenderedInSidebar:u=!1,size:f,__next40pxDefaultSize:p,...m}=h(e,`BorderBoxControl`),g=!!c&&!s,_=hasMixedBorders(l),v=hasSplitBorders(l),y=v?getCommonBorder(l):l,b=v?l:getSplitBorders(l),x=!isNaN(parseFloat(`${y?.width}`)),[S,C]=(0,r.useState)(!_),toggleLinked=()=>C(!S),onLinkedChange=e=>{if(!e)return i(void 0);if(!_||isCompleteBorder(e))return i(isEmptyBorder(e)?void 0:e);let t=getBorderDiff(y,e),n={top:{...l?.top,...t},right:{...l?.right,...t},bottom:{...l?.bottom,...t},left:{...l?.left,...t}};if(hasMixedBorders(n))return i(n);let r=isEmptyBorder(n.top)?void 0:n.top;i(r)},onSplitChange=(e,t)=>{let n={...b,[t]:e};hasMixedBorders(n)?i(n):i(e)},w=d(P[`linked-border-control`],{[P[`linked-border-control-full-width`]]:g}),T=P.wrapper,E=P.header;return{...m,className:t,colors:n,hasVisibleLabel:g,headerClassName:E,hideLabelFromVision:s,label:c,disableUnits:_&&!x,enableAlpha:a,enableStyle:o,hasMixedBorders:_,isLinked:S,linkedControlClassName:w,onLinkedChange,onSplitChange,toggleLinked,linkedValue:y,splitValue:b,wrapperClassName:T,__experimentalIsRenderedInSidebar:u}}function init_hook$3(){return(init_hook$3=e((()=>{u(),n(),init_style_module(),init_utils(),v()})))()}var W,BorderLabel,UnconnectedBorderBoxControl,G;function init_component$3(){return(init_component$3=e((()=>{l(),n(),a(),s(),init_component(),init_component$2(),D(),C(),k(),x(),y(),g(),init_hook$3(),W=t(),BorderLabel=e=>{let{id:t,label:n,hideLabelFromVision:r}=e;return n?r?(0,W.jsx)(b,{as:`span`,id:t,children:n}):(0,W.jsx)(w.VisualLabel,{id:t,children:n}):null},UnconnectedBorderBoxControl=(e,t)=>{let{className:n,colors:a,disableCustomColors:s,disableUnits:l,enableAlpha:u,enableStyle:d,hasMixedBorders:f,hasVisibleLabel:p,headerClassName:m,hideLabelFromVision:h,isLinked:g,label:_,linkedControlClassName:v,linkedValue:y,onLinkedChange:b,onSplitChange:x,popoverPlacement:C,popoverOffset:w,splitValue:T,toggleLinked:E,wrapperClassName:D,__experimentalIsRenderedInSidebar:k,"aria-label":j,"aria-labelledby":M,...N}=useBorderBoxControl(e),P=i(G,`border-box-control-label`),F=_&&!j&&!M?P:void 0,[L,R]=(0,r.useState)(null),z=(0,r.useMemo)(()=>C?{placement:C,offset:w,anchor:L,shift:!0}:void 0,[C,w,L]),V=o([R,t]);return(0,W.jsxs)(S,{className:n,role:_||j||M?`group`:void 0,"aria-label":j,"aria-labelledby":M??F,...N,ref:V,children:[p?(0,W.jsxs)(A,{className:m,columns:2,templateColumns:`1fr min-content`,alignment:`center`,children:[(0,W.jsx)(BorderLabel,{id:F,label:_,hideLabelFromVision:h}),(0,W.jsx)(I,{onClick:E,isLinked:g})]}):(0,W.jsx)(BorderLabel,{id:F,label:_,hideLabelFromVision:h}),(0,W.jsxs)(S,{className:D,children:[g?(0,W.jsx)(O,{className:v,colors:a,disableUnits:l,disableCustomColors:s,enableAlpha:u,enableStyle:d,onChange:b,placeholder:f?c(`Mixed`):void 0,__unstablePopoverProps:z,shouldSanitizeBorder:!1,value:y,withSlider:!0,width:`116px`,__experimentalIsRenderedInSidebar:k}):(0,W.jsx)(B,{colors:a,disableCustomColors:s,enableAlpha:u,enableStyle:d,onChange:x,popoverPlacement:C,popoverOffset:w,value:T,__experimentalIsRenderedInSidebar:k}),!p&&(0,W.jsx)(I,{onClick:E,isLinked:g})]})]})},G=_(UnconnectedBorderBoxControl,`BorderBoxControl`);try{G.__docgenInfo={description:`An input control for the color, style, and width of the border of a box. The
border can be customized as a whole, or individually for each side of the box.

The controls are exposed as a group named by the \`label\` prop. Passing
\`aria-labelledby\` or \`aria-label\` names the group instead, taking precedence
over \`label\`; with none of the three, the wrapper is not exposed as a group.

\`\`\`jsx
import { BorderBoxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const colors = [
	{ name: 'Blue 20', color: '#72aee6' },
	// ...
];

const MyBorderBoxControl = () => {
	const defaultBorder = {
		color: '#72aee6',
		style: 'dashed',
		width: '1px',
	};
	const [ borders, setBorders ] = useState( {
		top: defaultBorder,
		right: defaultBorder,
		bottom: defaultBorder,
		left: defaultBorder,
	} );
	const onChange = ( newBorders ) => setBorders( newBorders );

	return (
		<BorderBoxControl
			colors={ colors }
			label={ __( 'Borders' ) }
			onChange={ onChange }
			value={ borders }
		/>
	);
};
\`\`\``,displayName:`BorderBoxControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/border-box-control/border-box-control/component.tsx`,methods:[],props:{colors:{defaultValue:{value:`[]`},declarations:[{fileName:`gutenberg/packages/components/src/color-palette/types.ts`,name:`TypeLiteral`}],description:`Array with the colors to be shown. When displaying multiple color palettes
to choose from, the format of the array changes from an array of colors
objects, to an array of color palettes.`,name:`colors`,required:!1,tags:{},type:{name:`PaletteObject[] | ColorObject[]`}},__experimentalIsRenderedInSidebar:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/color-palette/types.ts`,name:`TypeLiteral`}],description:`Whether this is rendered in the sidebar.`,name:`__experimentalIsRenderedInSidebar`,required:!1,tags:{},type:{name:`boolean`}},disableCustomColors:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`This toggles the ability to choose custom colors.`,name:`disableCustomColors`,required:!1,tags:{},type:{name:`boolean`}},enableAlpha:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`This controls whether the alpha channel will be offered when selecting
custom colors.`,name:`enableAlpha`,required:!1,tags:{},type:{name:`boolean`}},hideLabelFromVision:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`Provides control over whether the label will only be visible to
screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`If provided, a label will be generated using this as the content.`,name:`label`,required:!1,tags:{},type:{name:`string`}},size:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`Size of the control.
@deprecated This prop no longer has any effect.
@ignore`,name:`size`,required:!1,tags:{},type:{name:`enum`,raw:`"default" | "__unstable-large"`,value:[{value:`"default"`},{value:`"__unstable-large"`}]}},__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the default size in a future version.
@deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},enableStyle:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/border-control/types.ts`,name:`TypeLiteral`}],description:`This controls whether to support border style selection.`,name:`enableStyle`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-box-control/types.ts`,name:`TypeLiteral`}],description:`A callback function invoked when any border value is changed. The value
received may be a "flat" border object, one that has properties defining
individual side borders, or \`undefined\`.`,name:`onChange`,required:!0,tags:{},type:{name:`(value: AnyBorder) => void`}},popoverPlacement:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-box-control/types.ts`,name:`TypeLiteral`}],description:`The position of the color popovers compared to the control wrapper.`,name:`popoverPlacement`,required:!1,tags:{},type:{name:`enum`,raw:`PopoverPlacement`,value:[{value:`"top"`},{value:`"bottom"`},{value:`"left"`},{value:`"right"`},{value:`"top-end"`},{value:`"top-start"`},{value:`"bottom-end"`},{value:`"bottom-start"`},{value:`"left-end"`},{value:`"left-start"`},{value:`"right-end"`},{value:`"right-start"`},{value:`"overlay"`}]}},popoverOffset:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-box-control/types.ts`,name:`TypeLiteral`}],description:`The space between the popover and the control wrapper. A number
displaces the popover along its main axis; pass an object to also
displace it along its cross axis.`,name:`popoverOffset`,required:!1,tags:{},type:{name:`number | { mainAxis?: number; crossAxis?: number; } | undefined`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/border-box-control/types.ts`,name:`TypeLiteral`}],description:'An object representing the current border configuration.\n\nThis may be a "flat" border where the object has `color`, `style`, and\n`width` properties or a "split" border which defines the previous\nproperties but for each side; `top`, `right`, `bottom`, and `left`.',name:`value`,required:!0,tags:{},type:{name:`AnyBorder`}}},tags:{}}}catch{}})))()}var K,q,J,Template,Y,X;function init_index_story(){return(init_index_story=e((()=>{n(),T(),init_component$3(),K=t(),q={id:`components-borderboxcontrol`,title:`Components/@wordpress-components/BorderBoxControl`,component:G,argTypes:{onChange:{action:`onChange`},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},J=[{name:`Blue 20`,color:`#72aee6`},{name:`Blue 40`,color:`#3582c4`},{name:`Red 40`,color:`#e65054`},{name:`Red 70`,color:`#8a2424`},{name:`Yellow 10`,color:`#f2d675`},{name:`Yellow 40`,color:`#bd8600`}],Template=e=>{let{onChange:t,...n}=e,[i,a]=(0,r.useState)(),onChangeMerged=e=>{a(e),t(e)};return(0,K.jsxs)(K.Fragment,{children:[(0,K.jsx)(G,{...n,onChange:onChangeMerged,value:i}),(0,K.jsx)(`hr`,{style:{marginTop:`100px`,borderColor:`#ddd`,borderStyle:`solid`,borderBottom:`none`}}),(0,K.jsx)(`p`,{style:{color:`#6c6c6c`,fontSize:`0.9em`},children:`The BorderBoxControl is intended to be used within a component that will provide reset controls. The button below is only for convenience.`}),(0,K.jsx)(E,{__next40pxDefaultSize:!0,variant:`primary`,onClick:()=>onChangeMerged(void 0),children:`Reset`})]})},Y=Template.bind({}),Y.args={colors:J,label:`Borders`,enableStyle:!0},X=Template.bind({}),X.args={...Y.args,label:void 0};try{X.__docgenInfo={description:`With no visible label there is no label row for the linked/unlinked toggle to
join, so it is rendered alongside the border inputs instead.`,displayName:`WithoutLabel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/border-box-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`props => {
  const {
    onChange,
    ...otherProps
  } = props;
  const [borders, setBorders] = useState<(typeof props)['value']>();
  const onChangeMerged: ComponentProps<typeof BorderBoxControl>['onChange'] = newBorders => {
    setBorders(newBorders);
    onChange(newBorders);
  };
  return <>
            <BorderBoxControl {...otherProps} onChange={onChangeMerged} value={borders} />
            <hr style={{
      marginTop: '100px',
      borderColor: '#ddd',
      borderStyle: 'solid',
      borderBottom: 'none'
    }} />
            <p style={{
      color: '#6c6c6c',
      fontSize: '0.9em'
    }}>
                The BorderBoxControl is intended to be used within a component
                that will provide reset controls. The button below is only for
                convenience.
            </p>
            <Button __next40pxDefaultSize variant="primary" onClick={() => onChangeMerged(undefined)}>
                Reset
            </Button>
        </>;
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`props => {
  const {
    onChange,
    ...otherProps
  } = props;
  const [borders, setBorders] = useState<(typeof props)['value']>();
  const onChangeMerged: ComponentProps<typeof BorderBoxControl>['onChange'] = newBorders => {
    setBorders(newBorders);
    onChange(newBorders);
  };
  return <>
            <BorderBoxControl {...otherProps} onChange={onChangeMerged} value={borders} />
            <hr style={{
      marginTop: '100px',
      borderColor: '#ddd',
      borderStyle: 'solid',
      borderBottom: 'none'
    }} />
            <p style={{
      color: '#6c6c6c',
      fontSize: '0.9em'
    }}>
                The BorderBoxControl is intended to be used within a component
                that will provide reset controls. The button below is only for
                convenience.
            </p>
            <Button __next40pxDefaultSize variant="primary" onClick={() => onChangeMerged(undefined)}>
                Reset
            </Button>
        </>;
}`,...X.parameters?.docs?.source},description:{story:`With no visible label there is no label row for the linked/unlinked toggle to
join, so it is rendered alongside the border inputs instead.`,...X.parameters?.docs?.description}}}})))()}init_index_story();export{Y as Default,X as WithoutLabel,q as default};