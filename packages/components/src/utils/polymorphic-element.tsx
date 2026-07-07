/**
 * External dependencies
 */
import type * as React from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

type PolymorphicElementProps< T extends React.ElementType > = Omit<
	React.ComponentPropsWithoutRef< T >,
	'as'
> & {
	as?: T;
};

type PolymorphicElementRef< T extends React.ElementType > =
	React.ComponentPropsWithRef< T >[ 'ref' ];

const customAttributeRegExp = /^(data|aria|x)-/i;
const eventHandlerRegExp = /^on[A-Z]/;

// Derived from @emotion/is-prop-valid's React prop allowlist, but split by
// element type so SVG-only props are intentionally filtered from HTML elements.
// The event-handler check is also deliberately stricter than Emotion's
// charCode-based `on*` fallback.
const svgElementNames = new Set(
	`animate animateMotion animateTransform circle clipPath defs desc ellipse
	feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix
	feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood
	feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode
	feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile
	feTurbulence filter foreignObject g image line linearGradient marker mask
	metadata mpath path pattern polygon polyline radialGradient rect set stop svg
	switch symbol text textPath tspan use view`.split( /\s+/ )
);

const baseElementProps = new Set(
	`children dangerouslySetInnerHTML key autoFocus defaultValue defaultChecked
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
	itemType itemID itemRef on option results security unselectable`.split( /\s+/ )
);

const svgElementProps = new Set(
	`accentHeight accumulate additive alignmentBaseline allowReorder alphabetic
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
	zoomAndPan`.split( /\s+/ )
);

const compatElementProps = new Set( [ 'autofocus', 'class', 'for' ] );

function isValidIntrinsicElementProp( prop: string, element: string ) {
	if (
		customAttributeRegExp.test( prop ) ||
		eventHandlerRegExp.test( prop )
	) {
		return true;
	}

	if ( baseElementProps.has( prop ) || compatElementProps.has( prop ) ) {
		return true;
	}

	return svgElementNames.has( element ) && svgElementProps.has( prop );
}

function filterIntrinsicElementProps(
	props: PolymorphicElementProps< React.ElementType >,
	element: string
) {
	return Object.fromEntries(
		Object.entries( props ).filter( ( [ prop ] ) =>
			isValidIntrinsicElementProp( prop, element )
		)
	);
}

function UnforwardedPolymorphicElement(
	{ as, ...props }: PolymorphicElementProps< React.ElementType >,
	ref: React.ForwardedRef< unknown >
) {
	const Element = as || 'div';
	const forwardedProps =
		typeof Element === 'string'
			? filterIntrinsicElementProps( props, Element )
			: props;

	return <Element ref={ ref } { ...forwardedProps } />;
}

/**
 * Internal utility for components that need Emotion-compatible `as` behavior
 * while rendering with plain React elements.
 */
export const PolymorphicElement = forwardRef(
	UnforwardedPolymorphicElement
) as < T extends React.ElementType = 'div' >(
	props: PolymorphicElementProps< T > & {
		ref?: PolymorphicElementRef< T >;
	}
) => React.ReactElement | null;
