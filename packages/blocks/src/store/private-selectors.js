/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getBlockType } from './selectors';
import { getValueFromObjectPath } from './utils';
import { __EXPERIMENTAL_STYLE_PROPERTY as RAW_STYLE_PROPERTY } from '../api/constants';

const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'captionColor',
	'buttonColor',
	'headingColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'padding',
	'contentSize',
	'wideSize',
	'blockGap',
	'textDecoration',
	'textTransform',
	'letterSpacing',
];

const TYPOGRAPHY_SUPPORTS_EXPERIMENTAL_TO_STABLE = {
	__experimentalFontFamily: 'fontFamily',
	__experimentalTextDecoration: 'textDecoration',
	__experimentalFontStyle: 'fontStyle',
	__experimentalFontWeight: 'fontWeight',
	__experimentalLetterSpacing: 'letterSpacing',
	__experimentalTextTransform: 'textTransform',
	__experimentalWritingMode: 'writingMode',
};

// Stabilize the style property support keys by mapping experimental supports to stable supports.
const STYLE_PROPERTY = Object.keys( RAW_STYLE_PROPERTY ).reduce(
	( acc, key ) => {
		const value = RAW_STYLE_PROPERTY[ key ];
		const support = value.support;

		if ( support[ 0 ] === 'typography' ) {
			const stableSupport =
				TYPOGRAPHY_SUPPORTS_EXPERIMENTAL_TO_STABLE[ support[ 1 ] ];

			if ( stableSupport ) {
				acc[ key ] = {
					...value,
					support: [ 'typography', stableSupport ],
				};
			} else {
				acc[ key ] = value;
			}
		} else {
			acc[ key ] = value;
		}

		return acc;
	},
	{}
);

/**
 * Filters the list of supported styles for a given element.
 *
 * @param {string[]}         blockSupports list of supported styles.
 * @param {string|undefined} name          block name.
 * @param {string|undefined} element       element name.
 *
 * @return {string[]} filtered list of supported styles.
 */
function filterElementBlockSupports( blockSupports, name, element ) {
	return blockSupports.filter( ( support ) => {
		if ( support === 'fontSize' && element === 'heading' ) {
			return false;
		}

		// This is only available for links
		if ( support === 'textDecoration' && ! name && element !== 'link' ) {
			return false;
		}

		// This is only available for heading, button, caption and text
		if (
			support === 'textTransform' &&
			! name &&
			! (
				[ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
					element
				) ||
				element === 'button' ||
				element === 'caption' ||
				element === 'text'
			)
		) {
			return false;
		}

		// This is only available for heading, button, caption and text
		if (
			support === 'letterSpacing' &&
			! name &&
			! (
				[ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
					element
				) ||
				element === 'button' ||
				element === 'caption' ||
				element === 'text'
			)
		) {
			return false;
		}

		// Text columns is only available for blocks.
		if ( support === 'textColumns' && ! name ) {
			return false;
		}

		return true;
	} );
}

function getStableBlockSupports( blockType ) {
	if ( ! blockType.supports ) {
		return {};
	}

	const supports = { ...blockType.supports };

	if ( blockType.supports.typography ) {
		supports.typography = {};
		Object.keys( blockType.supports.typography ).forEach(
			( typographySupport ) => {
				const stableSupport =
					TYPOGRAPHY_SUPPORTS_EXPERIMENTAL_TO_STABLE[
						typographySupport
					];

				if ( stableSupport ) {
					supports.typography[ stableSupport ] =
						blockType.supports.typography[ typographySupport ];
				} else {
					supports.typography[ typographySupport ] =
						blockType.supports.typography[ typographySupport ];
				}
			}
		);
	}

	return supports;
}

/**
 * Returns the list of supported styles for a given block name and element.
 */
export const getSupportedStyles = createSelector(
	( state, name, element ) => {
		if ( ! name ) {
			return filterElementBlockSupports(
				ROOT_BLOCK_SUPPORTS,
				name,
				element
			);
		}

		const blockType = getBlockType( state, name );

		if ( ! blockType ) {
			return [];
		}

		const supportKeys = [];
		const blockTypeSupports = getStableBlockSupports( blockType );

		// Check for blockGap support.
		// Block spacing support doesn't map directly to a single style property, so needs to be handled separately.
		if ( blockTypeSupports?.spacing?.blockGap ) {
			supportKeys.push( 'blockGap' );
		}

		// check for shadow support
		if ( blockTypeSupports?.shadow ) {
			supportKeys.push( 'shadow' );
		}

		Object.keys( STYLE_PROPERTY ).forEach( ( styleName ) => {
			if ( ! STYLE_PROPERTY[ styleName ].support ) {
				return;
			}

			// Opting out means that, for certain support keys like background color,
			// blocks have to explicitly set the support value false. If the key is
			// unset, we still enable it.
			if ( STYLE_PROPERTY[ styleName ].requiresOptOut ) {
				if (
					STYLE_PROPERTY[ styleName ].support[ 0 ] in
						blockTypeSupports &&
					getValueFromObjectPath(
						blockTypeSupports,
						STYLE_PROPERTY[ styleName ].support
					) !== false
				) {
					supportKeys.push( styleName );
					return;
				}
			}

			if (
				getValueFromObjectPath(
					blockTypeSupports,
					STYLE_PROPERTY[ styleName ].support,
					false
				)
			) {
				supportKeys.push( styleName );
			}
		} );

		return filterElementBlockSupports( supportKeys, name, element );
	},
	( state, name ) => [ state.blockTypes[ name ] ]
);

/**
 * Returns the bootstrapped block type metadata for a give block name.
 *
 * @param {Object} state Data state.
 * @param {string} name  Block name.
 *
 * @return {Object} Bootstrapped block type metadata for a block.
 */
export function getBootstrappedBlockType( state, name ) {
	return state.bootstrappedBlockTypes[ name ];
}

/**
 * Returns all the unprocessed (before applying the `registerBlockType` filter)
 * block type settings as passed during block registration.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Unprocessed block type settings for all blocks.
 */
export function getUnprocessedBlockTypes( state ) {
	return state.unprocessedBlockTypes;
}

/**
 * Returns all the block bindings sources registered.
 *
 * @param {Object} state Data state.
 *
 * @return {Object} All the registered sources and their properties.
 */
export function getAllBlockBindingsSources( state ) {
	return state.blockBindingsSources;
}

/**
 * Returns a specific block bindings source.
 *
 * @param {Object} state      Data state.
 * @param {string} sourceName Name of the source to get.
 *
 * @return {Object} The specific block binding source and its properties.
 */
export function getBlockBindingsSource( state, sourceName ) {
	return state.blockBindingsSources[ sourceName ];
}
