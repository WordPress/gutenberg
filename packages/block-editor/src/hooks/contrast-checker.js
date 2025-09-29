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

function getComputedValue( node, property ) {
	return node.ownerDocument.defaultView
		.getComputedStyle( node )
		.getPropertyValue( property );
}

function getBlockElementColors( blockEl, rootSelector ) {
	if ( ! blockEl ) {
		return {};
	}

	// Use the block's root selector to find the element where colors are applied
	let targetElement = blockEl;
	if ( rootSelector ) {
		// Extract the last part of the selector (e.g., ".wp-block-button__link" from ".wp-block-button .wp-block-button__link")
		const selectorParts = rootSelector.split( ' ' );
		const lastSelector = selectorParts[ selectorParts.length - 1 ];

		const selectedElement = blockEl.querySelector( lastSelector );
		if ( selectedElement ) {
			targetElement = selectedElement;
		}
	}

	const firstLinkElement = blockEl.querySelector( 'a' );
	const linkColor = !! firstLinkElement?.innerText
		? getComputedValue( firstLinkElement, 'color' )
		: undefined;

	const textColor = getComputedValue( targetElement, 'color' );

	let backgroundColorNode = targetElement;
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

	// Get the block's root selector from its block type definition.
	const rootSelector = useSelect(
		( select ) => {
			const blockName =
				select( blockEditorStore ).getBlockName( clientId );
			const blockType = select( blocksStore ).getBlockType( blockName );
			return blockType?.selectors?.root;
		},
		[ clientId ]
	);

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	useLayoutEffect( () => {
		if ( ! blockEl ) {
			return;
		}

		function updateColors() {
			setColors( getBlockElementColors( blockEl, rootSelector ) );
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
