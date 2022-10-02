/**
 * External dependencies
 */
import { pickBy, isEmpty, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { ATTRIBUTE_PROPERTY, STYLE_PROPERTY } from './constants';

const identity = ( x ) => x;

/**
 * Check whether serialization of specific block support feature or set should
 * be skipped.
 *
 * @param {string} blockType  Block name.
 * @param {string} featureSet Name of block support feature set.
 * @param {string} feature    Name of the individual feature to check.
 *
 * @return {boolean} Whether serialization should occur.
 */
function shouldSkipSerialization( blockType, featureSet, feature ) {
	const support = getBlockSupport( blockType, featureSet );
	const skipSerialization = support?.__experimentalSkipSerialization;

	if ( Array.isArray( skipSerialization ) ) {
		return skipSerialization.includes( feature );
	}

	return skipSerialization;
}

/**
 * Remove attributes and styles, taking into account serialization of block supports.
 *
 * @param {string} block      Block name.
 * @param {*}      attributes Block attributes.
 * @return {*} Cleaned up block attributes.
 */
export function removeBlockSupportAttributes( block, attributes ) {
	// Omit className and style from attributes.
	const { className, style, ...restAttributes } = attributes;

	// Create new attributes object.
	const newAttributes = Object.keys( ATTRIBUTE_PROPERTY ).reduce(
		( acc, attributeName ) => {
			const support = ATTRIBUTE_PROPERTY[ attributeName ];

			const skipSerialization = shouldSkipSerialization(
				block,
				support[ 0 ],
				support[ 1 ]
			);

			// Reset attributes which serialization is NOT omitted.
			if ( ! skipSerialization ) {
				acc[ attributeName ] = undefined;
				return acc;
			}

			// Add attributes which serialization is omitted.
			acc[ attributeName ] = restAttributes[ attributeName ];
			return acc;
		},
		{}
	);

	// Create new style object.
	const newStyle = Object.keys( STYLE_PROPERTY ).reduce(
		( acc, styleName ) => {
			// Initialize style name properties.
			acc[ styleName ] = {};
			if ( styleName === 'border' ) {
				acc[ styleName ] = {
					top: {},
					right: {},
					bottom: {},
					left: {},
				};
			}

			// Only add styles for which serialization is omitted.
			Object.keys( STYLE_PROPERTY[ styleName ] ).forEach( ( key ) => {
				const { support, subProperties, additionalProperties } =
					STYLE_PROPERTY[ styleName ][ key ];

				const skipSerialization = shouldSkipSerialization(
					block,
					support[ 0 ],
					support[ 1 ]
				);

				// Skip styles which serialization is NOT omitted.
				if ( ! skipSerialization ) {
					return;
				}

				// Add border-radius styles.
				if ( subProperties ) {
					if ( typeof style?.[ styleName ]?.[ key ] === 'string' ) {
						acc[ styleName ][ key ] = style?.[ styleName ]?.[ key ];
					} else if (
						typeof style?.[ styleName ]?.[ key ] === 'object'
					) {
						acc[ styleName ][ key ] = {};
						subProperties.forEach( ( prop ) => {
							acc[ styleName ][ key ][ prop ] =
								style?.[ styleName ]?.[ key ]?.[ prop ];
						} );
					}
					return;
				}

				// Add border-{color|width|style} styles.
				if ( additionalProperties ) {
					if ( typeof style?.[ styleName ]?.[ key ] === 'string' ) {
						acc[ styleName ][ key ] = style?.[ styleName ]?.[ key ];
					} else {
						additionalProperties.forEach( ( prop ) => {
							acc[ styleName ][ prop ][ key ] =
								style?.[ styleName ]?.[ prop ]?.[ key ];
						} );
					}
					return;
				}

				// Add other styles.
				acc[ styleName ][ key ] = style?.[ styleName ]?.[ key ];
			} );

			return acc;
		},
		{}
	);

	// Override with new block support attributes and styles.
	return (
		cleanEmptyObject( {
			...restAttributes,
			...newAttributes,
			style: {
				...style,
				...newStyle,
			},
		} ) || {}
	);
}

/**
 * Create the path to fetch api.
 *
 * @param {string} block        Block name.
 * @param {*}      attributes   Block attributes.
 * @param {*}      urlQueryArgs Query arguments to apply to the request URL.
 * @return {string} Path to fetch api.
 */
export function rendererPath( block, attributes = null, urlQueryArgs = {} ) {
	return addQueryArgs( `/wp/v2/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
		...urlQueryArgs,
	} );
}

/**
 * Removed falsy values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from falsy values
 */
export const cleanEmptyObject = ( object ) => {
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};
