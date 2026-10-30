import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";function isValidIntrinsicElementProp(e,t){return a.test(e)||o.test(e)||c.has(e)||u.has(e)?!0:s.has(t)&&l.has(e)}function filterIntrinsicElementProps(e,t){return Object.fromEntries(Object.entries(e).filter(([e])=>isValidIntrinsicElementProp(e,t)))}function UnforwardedPolymorphicElement({as:e,...t},n){let r=e||`div`,a=typeof r==`string`?filterIntrinsicElementProps(t,r):t;return(0,i.jsx)(r,{ref:n,...a})}var i,a,o,s,c,l,u,d;function init_polymorphic_element(){return(init_polymorphic_element=e((()=>{n(),i=t(),a=/^(data|aria|x)-/i,o=/^on[A-Z]/,s=new Set(`animate animateMotion animateTransform circle clipPath defs desc ellipse
	feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix
	feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood
	feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode
	feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile
	feTurbulence filter foreignObject g image line linearGradient marker mask
	metadata mpath path pattern polygon polyline radialGradient rect set stop svg
	switch symbol text textPath tspan use view`.split(/\s+/)),c=new Set(`children dangerouslySetInnerHTML key autoFocus defaultValue defaultChecked
	innerHTML suppressContentEditableWarning suppressHydrationWarning valueLink
	abbr accept acceptCharset accessKey action allow allowUserMedia
	allowPaymentRequest allowFullScreen allowTransparency alt async autoComplete
	autoPlay capture cellPadding cellSpacing challenge charSet checked cite classID
	className cols colSpan content contentEditable contextMenu controls controlsList
	coords crossOrigin data dateTime decoding default defer dir disabled
	disablePictureInPicture disableRemotePlayback download draggable encType
	enterKeyHint fetchpriority fetchPriority form formAction formEncType formMethod
	formNoValidate formTarget frameBorder headers height hidden high href hrefLang
	htmlFor httpEquiv id inputMode integrity is keyParams keyType kind label lang
	list loading loop low marginHeight marginWidth max maxLength media mediaGroup
	method min minLength multiple muted name nonce noValidate open optimum pattern
	placeholder playsInline popover popoverTarget popoverTargetAction poster
	preload profile radioGroup readOnly referrerPolicy rel required reversed role
	rows rowSpan sandbox scope scoped scrolling seamless selected shape size sizes
	slot span spellCheck src srcDoc srcLang srcSet start step style summary
	tabIndex target title translate type useMap value width wmode wrap about
	datatype inlist prefix property resource typeof vocab autoCapitalize
	autoCorrect autoSave color incremental fallback inert itemProp itemScope
	itemType itemID itemRef on option results security unselectable`.split(/\s+/)),l=new Set(`accentHeight accumulate additive alignmentBaseline allowReorder alphabetic
	amplitude arabicForm ascent attributeName attributeType autoReverse azimuth
	baseFrequency baselineShift baseProfile bbox begin bias by calcMode capHeight
	clip clipPathUnits clipPath clipRule colorInterpolation
	colorInterpolationFilters colorProfile colorRendering contentScriptType
	contentStyleType cursor cx cy d decelerate descent diffuseConstant direction
	display divisor dominantBaseline dur dx dy edgeMode elevation enableBackground
	end exponent externalResourcesRequired fill fillOpacity fillRule filter
	filterRes filterUnits floodColor floodOpacity focusable fontFamily fontSize
	fontSizeAdjust fontStretch fontStyle fontVariant fontWeight format from fr fx
	fy g1 g2 glyphName glyphOrientationHorizontal glyphOrientationVertical
	glyphRef gradientTransform gradientUnits hanging horizAdvX horizOriginX
	ideographic imageRendering in in2 intercept k k1 k2 k3 k4 kernelMatrix
	kernelUnitLength kerning keyPoints keySplines keyTimes lengthAdjust
	letterSpacing lightingColor limitingConeAngle local markerEnd markerMid
	markerStart markerHeight markerUnits markerWidth mask maskContentUnits
	maskUnits mathematical mode numOctaves offset opacity operator order orient
	orientation origin overflow overlinePosition overlineThickness panose1
	paintOrder pathLength patternContentUnits patternTransform patternUnits
	pointerEvents points pointsAtX pointsAtY pointsAtZ preserveAlpha
	preserveAspectRatio primitiveUnits r radius refX refY renderingIntent
	repeatCount repeatDur requiredExtensions requiredFeatures restart result rotate
	rx ry scale seed shapeRendering slope spacing specularConstant
	specularExponent speed spreadMethod startOffset stdDeviation stemh stemv
	stitchTiles stopColor stopOpacity strikethroughPosition strikethroughThickness
	string stroke strokeDasharray strokeDashoffset strokeLinecap strokeLinejoin
	strokeMiterlimit strokeOpacity strokeWidth surfaceScale systemLanguage
	tableValues targetX targetY textAnchor textDecoration textRendering textLength
	to transform u1 u2 underlinePosition underlineThickness unicode unicodeBidi
	unicodeRange unitsPerEm vAlphabetic vHanging vIdeographic vMathematical values
	vectorEffect version vertAdvY vertOriginX vertOriginY viewBox viewTarget
	visibility widths wordSpacing writingMode x xHeight x1 x2 xChannelSelector
	xlinkActuate xlinkArcrole xlinkHref xlinkRole xlinkShow xlinkTitle xlinkType
	xmlBase xmlns xmlnsXlink xmlLang xmlSpace y y1 y2 yChannelSelector z
	zoomAndPan`.split(/\s+/)),u=new Set([`autofocus`,`class`,`for`]),d=(0,r.forwardRef)(UnforwardedPolymorphicElement);try{d.__docgenInfo={description:"Internal utility for components that need Emotion-compatible `as` behavior\nwhile rendering with plain React elements.",displayName:`PolymorphicElement`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/utils/polymorphic-element.tsx`,methods:[],props:{as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/utils/polymorphic-element.tsx`,name:`TypeLiteral`}],description:``,name:`as`,required:!1,tags:{},type:{name:`ElementType<any, keyof IntrinsicElements>`}},ref:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/utils/polymorphic-element.tsx`,name:`TypeLiteral`}],description:``,name:`ref`,required:!1,tags:{},type:{name:`any`}}},tags:{}}}catch{}})))()}function UnforwardedView({css:e,...t},n){return(0,f.jsx)(d,{ref:n,...t})}var f,p;function init_component(){return(init_component=e((()=>{n(),init_polymorphic_element(),f=t(),p=Object.assign((0,r.forwardRef)(UnforwardedView),{selector:`.components-view`});try{p.__docgenInfo={description:`\`View\` is a core component that renders everything in the library.
It is the principle component in the entire library.

\`\`\`jsx
import { View } from \`@wordpress/components\`;

function Example() {
	return (
		<View>
			 Code is Poetry
		</View>
	);
}
\`\`\``,displayName:`View`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/view/component.tsx`,methods:[],props:{as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element or React component to render the component as.`,name:`as`,required:!1,tags:{},type:{name:`any`}},css:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/view/component.tsx`,name:`TypeLiteral`}],description:`Legacy Emotion prop accepted as a no-op by \`View\` so it does not leak to
the rendered element.
@deprecated This prop no longer has any effect.
@ignore`,name:`css`,required:!1,tags:{},type:{name:`any`}}},tags:{}}}catch{}try{p.__docgenInfo={description:`\`View\` is a core component that renders everything in the library.
It is the principle component in the entire library.

\`\`\`jsx
import { View } from \`@wordpress/components\`;

function Example() {
	return (
		<View>
			 Code is Poetry
		</View>
	);
}
\`\`\``,displayName:`component`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/view/component.tsx`,methods:[],props:{as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element or React component to render the component as.`,name:`as`,required:!1,tags:{},type:{name:`any`}},css:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/view/component.tsx`,name:`TypeLiteral`}],description:`Legacy Emotion prop accepted as a no-op by \`View\` so it does not leak to
the rendered element.
@deprecated This prop no longer has any effect.
@ignore`,name:`css`,required:!1,tags:{},type:{name:`any`}}},tags:{}}}catch{}})))()}export{init_polymorphic_element as i,init_component as n,d as r,p as t};