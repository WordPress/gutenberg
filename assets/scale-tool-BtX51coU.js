import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{i,n as a,t as o}from"./build-module-CqL0UdL5.js";import{i as s,r as c}from"./component-BLPf_bbw.js";import{n as l,t as u}from"./component-CKatfvVB.js";import{n as d,t as f}from"./component-BTo0psPs.js";function ScaleTool({panelId:e,value:t,onChange:n,options:a=m,defaultValue:o=m[0].value,isShownByDefault:s=!0}){let l=t??o,d=(0,r.useMemo)(()=>a.reduce((e,t)=>(e[t.value]=t.help,e),{}),[a]);return(0,p.jsx)(f,{label:i(`Scale`,`Image scaling options`),isShownByDefault:s,hasValue:()=>l!==o,onDeselect:()=>n(o),panelId:e,children:(0,p.jsx)(c,{label:i(`Scale`,`Image scaling options`),isBlock:!0,help:d[l],value:l,onChange:n,children:a.map(e=>(0,p.jsx)(u,{...e},e.value))})})}var p,m;function init_scale_tool(){return(init_scale_tool=e((()=>{d(),s(),l(),n(),o(),p=t(),m=[{value:`fill`,label:i(`Fill`,`Scale option for dimensions control`),help:a(`Fill the space by stretching the content.`)},{value:`contain`,label:i(`Contain`,`Scale option for dimensions control`),help:a(`Fit the content to the space without clipping.`)},{value:`cover`,label:i(`Cover`,`Scale option for dimensions control`),help:a(`Fill the space by clipping what doesn't fit.`)},{value:`none`,label:i(`None`,`Scale option for dimensions control`),help:a(`Do not adjust the sizing of the content. Content that is too large will be clipped, and content that is too small will have additional padding.`)},{value:`scale-down`,label:i(`Scale down`,`Scale option for dimensions control`),help:a(`Scale down the content to fit the space if it is too big. Content that is too small will have additional padding.`)}];try{ScaleTool.__docgenInfo={description:`A tool to select the CSS object-fit property for the image.`,displayName:`scaletool`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/dimensions-tool/scale-tool.tsx`,methods:[],props:{panelId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`}],description:`ID of the panel that contains the controls.`,name:`panelId`,parent:{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`},required:!1,tags:{},type:{name:`string | null`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`}],description:`Current scale value.`,name:`value`,parent:{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`},required:!1,tags:{},type:{name:`string | null`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`}],description:`Callback to update the scale value.`,name:`onChange`,parent:{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`},required:!0,tags:{},type:{name:`(nextValue?: string | undefined) => void`}},options:{defaultValue:{value:`[
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for dimensions control' ),
		help: __( 'Fill the space by stretching the content.' ),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __( 'Fit the content to the space without clipping.' ),
	},
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for dimensions control' ),
		help: __( "Fill the space by clipping what doesn't fit." ),
	},
	{
		value: 'none',
		label: _x( 'None', 'Scale option for dimensions control' ),
		help: __(
			'Do not adjust the sizing of the content. Content that is too large will be clipped, and content that is too small will have additional padding.'
		),
	},
	{
		value: 'scale-down',
		label: _x( 'Scale down', 'Scale option for dimensions control' ),
		help: __(
			'Scale down the content to fit the space if it is too big. Content that is too small will have additional padding.'
		),
	},
]`},declarations:[{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`}],description:`Scale options.`,name:`options`,parent:{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`},required:!1,tags:{},type:{name:`DimensionsToolOption[]`}},defaultValue:{defaultValue:{value:`DEFAULT_SCALE_OPTIONS[ 0 ].value`},declarations:[{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`}],description:`Default scale value.`,name:`defaultValue`,parent:{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`},required:!1,tags:{},type:{name:`string`}},isShownByDefault:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`}],description:`Whether the tool panel is shown by default.`,name:`isShownByDefault`,parent:{fileName:`gutenberg/packages/block-editor/src/components/dimensions-tool/types.ts`,name:`ScaleToolProps`},required:!1,tags:{},type:{name:`boolean`}}},tags:{param:`props The component props.`,return:`The scale tool.`}}}catch{}})))()}export{init_scale_tool as n,ScaleTool as t};