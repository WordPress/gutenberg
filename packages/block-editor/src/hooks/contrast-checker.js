/**
 * WordPress dependencies
 */
import { useLayoutEffect, useReducer } from '@wordpress/element';
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import { store as blockEditorStore } from '../store';

function getComputedValue( node, property ) {
	return node.ownerDocument.defaultView
		.getComputedStyle( node )
		.getPropertyValue( property );
}

function getBlockElementColors( blockEl, blockType ) {
	if ( ! blockEl ) {
		return {};
	}

	const rootSelector = blockType?.selectors?.root || null;
	let targetElement = blockEl;

	if ( rootSelector ) {
		const [ , ...rest ] = rootSelector.split( ' ' );
		if ( rest.length ) {
			const innerSelector = rest.join( ' ' );
			targetElement = blockEl.querySelector( innerSelector ) || blockEl;
		}
	}

	// Retrieve colors from the target element.
	const firstLinkElement = targetElement.querySelector( 'a' );
	const linkColor = !! firstLinkElement?.innerText
		? getComputedValue( firstLinkElement, 'color' )
		: undefined;

	const textColor = getComputedValue( targetElement, 'color' );

	// Traverse up the DOM tree to find the background color.
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
	const blockType = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			return block ? getBlockType( block.name ) : null;
		},
		[ clientId ]
	);
	const [ colors, setColors ] = useReducer( reducer, {} );

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	useLayoutEffect( () => {
		if ( ! blockEl ) {
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
