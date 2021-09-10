// @ts-nocheck
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Pluck the modified styles by matching the modifier in the selector name.
 * The style selectors should follow the BEM naming convetion e.g.
 *    block__element--modifier
 * The return styles are keyed by the block_element only.
 *
 * @example
 * ```
 * selectModifiedStyles(
 *   {
 *    'block__element': { width: '10px' },
 *    'block__element--narrow': { width: '1px' },
 *    'block__element--wide': {width: '100px'}
 *   },
 *   'wide'
 * );
 * // returns { block_element': { width: '100px' } }
 * ```
 *
 * @param {Object} styles
 * @param {string} modifier - the base modifier without the `--` prefix
 *
 * @return {Object} - Subset of styles based on the modifier
 */
function selectModifiedStyles( styles, modifier ) {
	const modifierSelectors = Object.keys( styles ).filter( ( selector ) =>
		selector.match( `--${ modifier }$` )
	);

	return modifierSelectors.reduce( ( modifiedStyles, modifierSelector ) => {
		const blockElementSelector = modifierSelector.split( '--' )[ 0 ];
		modifiedStyles[ blockElementSelector ] = styles[ modifierSelector ];
		return modifiedStyles;
	}, {} );
}

/**
 * Updates a styles object with modified styles.
 *
 * @example
 *
 * ```
 * updateStyles(
 *  {
 *    'block__element-A' : { width: '10px' },
 *    'block__element-B' : { 'font-family': 'Comic Sans' },
 *    'block__element-C' : { visibility : 'hidden' }
 *  },
 *  {
 *    'block__element-A' : { height: '10px' },
 *    'block__element-B' : { 'font-family' : 'Helvetica' },
 *    'block__element-Z' : { 'z-index' : 2147483647 }
 *  }
 * );
 * // returns
 * // {
 * //   'block_element-A' : { width: '10px', height: '10px' },
 * //   'block-element-B' : { 'font-family' : 'Helvetica' },
 * //   'block-element-C' : { visibility : 'hidden' },
 * //   'block-element-Z' : { 'z-index' : 2147483647 }
 * // }
 * ```
 * @param {Object} styles
 * @param {Object} styleUpdates
 *
 * @return {Object} - Updated styles object
 */
function updateStyles( styles, styleUpdates ) {
	Object.keys( styleUpdates ).forEach( ( selector ) => {
		styles[ selector ] = {
			...styles[ selector ],
			...styleUpdates[ selector ],
		};
	} );

	return styles;
}

function useModifiedStyle( baseStyles, modifiers ) {
	return useMemo(
		() =>
			Object.keys( modifiers )
				.filter( ( modifier ) => modifiers[ modifier ] )
				.map( ( modifier ) =>
					selectModifiedStyles( baseStyles, modifier )
				)
				.reduce( updateStyles, { ...baseStyles } ),
		[ baseStyles, modifiers ].map( JSON.stringify )
	);
}

export default useModifiedStyle;
