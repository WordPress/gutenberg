/**
 * WordPress dependencies
 */
import { useLayoutEffect, useReducer } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import { store as blockEditorStore } from '../store';
import { store as blocksStore } from '@wordpress/blocks';
import { getBlockCSSSelector } from '../components/global-styles/get-block-css-selector';

function getComputedValue( node, property ) {
	return node.ownerDocument.defaultView
		.getComputedStyle( node )
		.getPropertyValue( property );
}

function getBlockElementColors( blockEl, blockType ) {
	if ( ! blockEl || ! blockType ) {
		return {};
	}

	// Get color-specific selectors.
	const textSelector = getBlockCSSSelector( blockType, 'color.text', {
		fallback: true,
	} );
	const backgroundSelector = getBlockCSSSelector(
		blockType,
		'color.background',
		{ fallback: true }
	);

	// Find target elements - querySelector handles all the complexity
	const textElement = blockEl.querySelector( textSelector ) || blockEl;
	const backgroundElement =
		blockEl.querySelector( backgroundSelector ) || blockEl;
	const linkElement = blockEl.querySelector( 'a' );

	// Get computed colors from the appropriate elements
	const textColor = getComputedValue( textElement, 'color' );
	const linkColor =
		linkElement && linkElement.innerText
			? getComputedValue( linkElement, 'color' )
			: undefined;

	let backgroundColorNode = backgroundElement;
	let backgroundColor = getComputedValue(
		backgroundColorNode,
		'background-color'
	);
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType ===
			backgroundColorNode.parentNode.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor = getComputedValue(
			backgroundColorNode,
			'background-color'
		);
	}

	return {
		textColor,
		backgroundColor,
		linkColor,
	};
}

function reducer( prevColors, newColors ) {
	const hasChanged = Object.keys( newColors ).some(
		( key ) => prevColors[ key ] !== newColors[ key ]
	);

	// Do not re-render if the colors have not changed.
	return hasChanged ? newColors : prevColors;
}

export default function BlockColorContrastChecker( { clientId } ) {
	const blockEl = useBlockElement( clientId );
	const [ colors, setColors ] = useReducer( reducer, {} );

	// Get the block type for selector resolution.
	const blockType = useSelect(
		( select ) => {
			const blockName =
				select( blockEditorStore ).getBlockName( clientId );
			return select( blocksStore ).getBlockType( blockName );
		},
		[ clientId ]
	);

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	useLayoutEffect( () => {
		if ( ! blockEl || ! blockType ) {
			return;
		}

		function updateColors() {
			setColors( getBlockElementColors( blockEl, blockType ) );
		}

		// Combine `useLayoutEffect` and two rAF calls to ensure that values are read
		// after the current paint but before the next paint.
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( updateColors )
		);
	} );

	return (
		<ContrastChecker
			backgroundColor={ colors.backgroundColor }
			textColor={ colors.textColor }
			linkColor={ colors.linkColor }
			enableAlphaChecker
		/>
	);
}
