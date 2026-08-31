/**
 * WordPress dependencies
 */
import { addFilter, applyFilters } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

/**
 * Converts an arbitrary string to a valid CSS class token.
 *
 * @param {string} value Raw string.
 * @return {string} CSS class safe string.
 */
const toStyleClass = ( value ) => {
	if ( typeof value !== 'string' ) {
		return '';
	}
	return value
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-|-$/g, '' );
};

/**
 * Parses a raw Gutenberg style value and categorizes it.
 *
 * @param {*} raw Raw value from block attributes.
 * @return {Object} Parsed value details containing type and safe string.
 */
const parseValue = ( raw ) => {
	if ( ! raw ) {
		return { type: 'empty', safe: '' };
	}
	const str = String( raw );
	if ( ! str ) {
		return { type: 'empty', safe: '' };
	}

	const presetMatch = str.match( /^var:preset\|[^|]+\|(.+)$/i );
	if ( presetMatch ) {
		return { type: 'preset', safe: toStyleClass( presetMatch[ 1 ] ) };
	}

	const cssVarMatch = str.match(
		/^var\(--wp--preset--[a-z0-9-]+--([a-z0-9-]+)\)$/i
	);
	if ( cssVarMatch ) {
		return { type: 'preset', safe: toStyleClass( cssVarMatch[ 1 ] ) };
	}

	if ( /^[a-z][a-z0-9-]*$/i.test( str ) ) {
		return { type: 'slug', safe: toStyleClass( str ) };
	}

	return { type: 'custom', safe: toStyleClass( str ) };
};

/**
 * Generates classes for a single scalar value property.
 *
 * @param {string}  property   CSS property name.
 * @param {*}       value      Raw value from block attrs.
 * @param {boolean} embedValue Whether to embed the raw value in the class.
 * @return {string[]} List of generated classes.
 */
const getSingleClasses = ( property, value, embedValue = false ) => {
	if ( ! value ) {
		return [];
	}
	const classes = [ `has-${ property }` ];
	const parsed = parseValue( value );

	if (
		parsed.type === 'preset' ||
		parsed.type === 'slug' ||
		( embedValue && parsed.safe )
	) {
		classes.push( `has-${ parsed.safe }-${ property }` );
	} else {
		classes.push( `has-custom-${ property }` );
	}
	return classes;
};

/**
 * Generates classes for spacing properties (padding, margin).
 *
 * @param {string} property 'padding' or 'margin'.
 * @param {*}      value    Property value.
 * @return {string[]} List of generated classes.
 */
const getSpacingClasses = ( property, value ) => {
	if ( ! value ) {
		return [];
	}
	if ( typeof value === 'string' ) {
		return getSingleClasses( property, value );
	}

	const sides = [ 'top', 'right', 'bottom', 'left' ];
	const activeSides = sides.filter( ( side ) => value[ side ] );

	if ( activeSides.length === 0 ) {
		return [];
	}

	const sideValues = activeSides.map( ( side ) => value[ side ] );
	const allEqual =
		activeSides.length === 4 && new Set( sideValues ).size === 1;

	const classes = [ `has-${ property }` ];

	if ( allEqual ) {
		const parsed = parseValue( sideValues[ 0 ] );
		classes.push(
			parsed.type === 'preset' || parsed.type === 'slug'
				? `has-${ parsed.safe }-${ property }`
				: `has-custom-${ property }`
		);
	} else {
		classes.push( `has-mixed-${ property }` );
		activeSides.forEach( ( side ) => {
			const parsed = parseValue( value[ side ] );
			classes.push(
				parsed.type === 'preset' || parsed.type === 'slug'
					? `has-${ parsed.safe }-${ side }-${ property }`
					: `has-custom-${ side }-${ property }`
			);
		} );
	}

	return classes;
};

/**
 * Generates classes for border radius.
 *
 * @param {*} value Property value.
 * @return {string[]} List of generated classes.
 */
const getBorderRadiusClasses = ( value ) => {
	if ( ! value ) {
		return [];
	}
	if ( typeof value === 'string' ) {
		return getSingleClasses( 'border-radius', value );
	}

	const corners = [ 'topLeft', 'topRight', 'bottomRight', 'bottomLeft' ];
	const activeCorners = corners.filter( ( corner ) => value[ corner ] );

	if ( activeCorners.length === 0 ) {
		return [];
	}

	const cornerValues = activeCorners.map( ( corner ) => value[ corner ] );
	const allEqual =
		activeCorners.length === 4 && new Set( cornerValues ).size === 1;

	const classes = [ 'has-border-radius' ];

	if ( allEqual ) {
		const parsed = parseValue( cornerValues[ 0 ] );
		classes.push(
			parsed.type === 'preset' || parsed.type === 'slug'
				? `has-${ parsed.safe }-border-radius`
				: 'has-custom-border-radius'
		);
	} else {
		classes.push( 'has-mixed-border-radius' );
		const cornerMap = {
			topLeft: 'top-left',
			topRight: 'top-right',
			bottomRight: 'bottom-right',
			bottomLeft: 'bottom-left',
		};
		activeCorners.forEach( ( corner ) => {
			const parsed = parseValue( value[ corner ] );
			const kebabCorner = cornerMap[ corner ];
			classes.push(
				parsed.type === 'preset' || parsed.type === 'slug'
					? `has-${ parsed.safe }-${ kebabCorner }-border-radius`
					: `has-custom-${ kebabCorner }-border-radius`
			);
		} );
	}
	return classes;
};

/**
 * Generates classes for per-side border properties: width, style, color.
 *
 * @param {string}  property   CSS property.
 * @param {Object}  borderObj  Border object.
 * @param {string}  key        Specific key to extract.
 * @param {boolean} embedValue Whether to embed the raw value.
 * @return {string[]} List of generated classes.
 */
const getBorderSideClasses = (
	property,
	borderObj,
	key,
	embedValue = false
) => {
	if ( ! borderObj ) {
		return [];
	}
	const uniform = borderObj[ key ];
	const sides = [ 'top', 'right', 'bottom', 'left' ];
	const activeSides = sides.filter(
		( side ) => borderObj[ side ] && borderObj[ side ][ key ]
	);

	if ( ! uniform && activeSides.length === 0 ) {
		return [];
	}

	const classes = [ `has-${ property }` ];

	const getClass = ( raw, side = '' ) => {
		const parsed = parseValue( raw );
		const suffix = side ? `-${ side }-${ property }` : `-${ property }`;
		if (
			parsed.type === 'preset' ||
			parsed.type === 'slug' ||
			( embedValue && parsed.safe )
		) {
			return `has-${ parsed.safe }${ suffix }`;
		}
		return `has-custom${ suffix }`;
	};

	if ( uniform ) {
		classes.push( getClass( uniform ) );
		return classes;
	}

	const sideValues = activeSides.map( ( side ) => borderObj[ side ][ key ] );
	const allEqual =
		activeSides.length === 4 && new Set( sideValues ).size === 1;

	if ( allEqual ) {
		classes.push( getClass( sideValues[ 0 ] ) );
	} else {
		classes.push( `has-mixed-${ property }` );
		activeSides.forEach( ( side ) => {
			classes.push( getClass( borderObj[ side ][ key ], side ) );
		} );
	}
	return classes;
};

/**
 * Map of property keys to their respective class generation functions.
 */
const processors = {
	padding: ( ctx ) =>
		getSpacingClasses( 'padding', ctx?.style?.spacing?.padding ),
	margin: ( ctx ) =>
		getSpacingClasses( 'margin', ctx?.style?.spacing?.margin ),
	'block-gap': ( ctx ) => {
		const gap = ctx?.style?.spacing?.blockGap;
		if ( ! gap ) {
			return [];
		}
		if ( typeof gap === 'string' ) {
			return getSingleClasses( 'block-gap', gap );
		}
		const classes = [ 'has-block-gap' ];
		[ 'horizontal', 'vertical' ].forEach( ( axis ) => {
			if ( gap[ axis ] ) {
				const parsed = parseValue( gap[ axis ] );
				classes.push(
					parsed.type === 'preset' || parsed.type === 'slug'
						? `has-${ parsed.safe }-${ axis }-block-gap`
						: `has-custom-${ axis }-block-gap`
				);
			}
		} );
		return classes;
	},
	'border-radius': ( ctx ) =>
		getBorderRadiusClasses( ctx?.style?.border?.radius ),
	'border-width': ( ctx ) =>
		getBorderSideClasses( 'border-width', ctx?.style?.border, 'width' ),
	'border-style': ( ctx ) =>
		getBorderSideClasses(
			'border-style',
			ctx?.style?.border,
			'style',
			true
		),
	'border-color': ( ctx ) =>
		getBorderSideClasses( 'border-color', ctx?.style?.border, 'color' ),
	'font-size': ( ctx ) =>
		getSingleClasses(
			'font-size',
			ctx?.style?.typography?.fontSize || ctx?.attrs?.fontSize
		),
	'font-weight': ( ctx ) =>
		getSingleClasses(
			'font-weight',
			ctx?.style?.typography?.fontWeight,
			true
		),
	'font-style': ( ctx ) =>
		getSingleClasses(
			'font-style',
			ctx?.style?.typography?.fontStyle,
			true
		),
	'font-family': ( ctx ) =>
		getSingleClasses(
			'font-family',
			ctx?.style?.typography?.fontFamily || ctx?.attrs?.fontFamily
		),
	shadow: ( ctx ) => getSingleClasses( 'shadow', ctx?.style?.shadow ),
	'aspect-ratio': ( ctx ) =>
		getSingleClasses(
			'aspect-ratio',
			ctx?.style?.dimensions?.aspectRatio,
			true
		),
	'min-height': ( ctx ) =>
		getSingleClasses( 'min-height', ctx?.style?.dimensions?.minHeight ),
	'color-background': ( ctx ) =>
		getSingleClasses( 'background', ctx?.style?.color?.background ),
	'color-text': ( ctx ) =>
		getSingleClasses( 'color', ctx?.style?.color?.text ),
};

/**
 * Higher Order Component that injects semantic style classes into the block wrapper in the editor.
 */
export const withStyleClasses = createHigherOrderComponent(
	( BlockListBlock ) => {
		const StyleClassesWrapper = ( props ) => {
			const enabledProperties = useSelect( ( select ) => {
				const settings = select( blockEditorStore ).getSettings();
				return settings.__experimentalStyleClassesEnabled || [];
			}, [] );

			if ( ! enabledProperties.length ) {
				return <BlockListBlock { ...props } />;
			}

			const { attributes, name: blockName } = props;

			/**
			 * Filters the list of style properties enabled for CSS class generation.
			 *
			 * @param {string[]} enabledProperties Array of enabled style property slugs.
			 * @param {Object}   props             Block wrapper props.
			 */
			let activeProps = applyFilters(
				'editor.enabledStyleProperties',
				enabledProperties,
				props
			);

			if ( blockName ) {
				const slug = blockName.replace( /\//g, '-' );

				/**
				 * Filters the list of style properties enabled for CSS class generation for a specific block type.
				 *
				 * @param {string[]} activeProps Array of enabled style property slugs.
				 * @param {Object}   props       Block wrapper props.
				 */
				activeProps = applyFilters(
					`editor.enabledStyleProperties.${ blockName }`,
					activeProps,
					props
				);

				/**
				 * Filters the list of style properties enabled for CSS class generation for a specific block slug.
				 *
				 * @param {string[]} activeProps Array of enabled style property slugs.
				 * @param {Object}   props       Block wrapper props.
				 */
				activeProps = applyFilters(
					`editor.enabledStyleProperties.${ slug }`,
					activeProps,
					props
				);
			}

			if ( ! activeProps.length ) {
				return <BlockListBlock { ...props } />;
			}

			const ctx = {
				style: attributes?.style || {},
				attrs: attributes || {},
			};
			let injectedClasses = [];

			activeProps.forEach( ( prop ) => {
				if ( processors[ prop ] ) {
					injectedClasses.push( ...processors[ prop ]( ctx ) );
				}
			} );

			/**
			 * Filters the final list of semantic style classes before they are injected into the block.
			 *
			 * @param {string[]} injectedClasses Array of semantic style classes.
			 * @param {Object}   props           Block wrapper props.
			 */
			injectedClasses = applyFilters(
				'editor.blockStyleClasses',
				injectedClasses,
				props
			);

			if ( injectedClasses.length > 0 ) {
				const existingClassName = props.wrapperProps?.className || '';
				const mergedClasses = Array.from(
					new Set( [
						...existingClassName.split( ' ' ),
						...injectedClasses,
					] )
				)
					.filter( Boolean )
					.join( ' ' );

				return (
					<BlockListBlock
						{ ...props }
						wrapperProps={ {
							...props.wrapperProps,
							className: mergedClasses,
						} }
					/>
				);
			}

			return <BlockListBlock { ...props } />;
		};

		return StyleClassesWrapper;
	},
	'withStyleClasses'
);

addFilter(
	'editor.BlockListBlock',
	'core/block-supports/style-classes',
	withStyleClasses
);
