/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * Internal dependencies
 */
import { getBlockType } from './selectors';
import { getValueFromObjectPath } from './utils';
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '../api/constants';

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

		// This is only available for heading
		if (
			support === 'textTransform' &&
			! name &&
			! [ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
				element
			)
		) {
			return false;
		}

		// This is only available for headings
		if (
			support === 'letterSpacing' &&
			! name &&
			! [ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
				element
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

		// Check for blockGap support.
		// Block spacing support doesn't map directly to a single style property, so needs to be handled separately.
		// Also, only allow `blockGap` support if serialization has not been skipped, to be sure global spacing can be applied.
		if (
			blockType?.supports?.spacing?.blockGap &&
			blockType?.supports?.spacing?.__experimentalSkipSerialization !==
				true &&
			! blockType?.supports?.spacing?.__experimentalSkipSerialization?.some?.(
				( spacingType ) => spacingType === 'blockGap'
			)
		) {
			supportKeys.push( 'blockGap' );
		}

		// check for shadow support
		if ( blockType?.supports?.shadow ) {
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
						blockType.supports &&
					getValueFromObjectPath(
						blockType.supports,
						STYLE_PROPERTY[ styleName ].support
					) !== false
				) {
					supportKeys.push( styleName );
					return;
				}
			}

			if (
				getValueFromObjectPath(
					blockType.supports,
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
