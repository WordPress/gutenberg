// @ts-nocheck
/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Pluck the modified styles by matching the modifier in the selector name.
 * The style selectors should follow the BEM naming convetion e.g.
 *    block__element--modifier
 * The return styles are keyed by the block_element only.
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

function isModifierEnabled( modifier, states ) {
	return states[ modifier ]?.every( ( truthy ) => truthy );
}

function mergeStyles( styles, styleUpdates ) {
	return Object.keys( styleUpdates ).reduce(
		( mergedStyles, selector ) => ( {
			...mergedStyles,
			[ selector ]: {
				...mergedStyles[ selector ],
				...styleUpdates[ selector ],
			},
		} ),
		styles
	);
}

function useModifiedStyle( baseStyles, modifierStates ) {
	const [ styles, setStyles ] = useState( baseStyles );
	const modifiers = Object.keys( modifierStates );

	const updateStyles = useMemo( () => {
		const modifiedBaseStyles = ( modifier ) =>
			selectModifiedStyles( baseStyles, modifier );

		const modifiedStyles = modifiers.reduce(
			( mergedStyles, modifier ) => ( {
				...mergedStyles,
				[ modifier ]: modifiedBaseStyles( modifier ),
			} ),
			{ ...baseStyles }
		);
		return ( updatedStyles, selector ) =>
			mergeStyles( updatedStyles, modifiedStyles[ selector ] );
	}, [] );

	// Convert the modified states to string to satisfy the equality check.
	const modifiedStatesString = Object.values( modifierStates ).toString();
	useEffect( () => {
		const enabledModifiers = ( modifier ) =>
			isModifierEnabled( modifier, modifierStates );
		const activeModifiers = modifiers.filter( enabledModifiers );
		const updatedStyles = activeModifiers.reduce( updateStyles, {
			...baseStyles,
		} );

		setStyles( updatedStyles );
	}, [ modifiedStatesString ] );

	return styles;
}

export default useModifiedStyle;
