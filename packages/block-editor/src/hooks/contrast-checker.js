/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect, useReducer } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { getBlockSelector } from '@wordpress/global-styles-engine';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { getContrastWarning } from '../components/contrast-checker';

import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

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
	const textSelector = getBlockSelector( blockType, 'color.text', {
		fallback: true,
	} );
	const backgroundSelector = getBlockSelector(
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
		linkElement && linkElement.textContent
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

/**
 * Returns a contrast warning message for a block's computed colors, or
 * `undefined` when contrast is sufficient or checking is disabled.
 *
 * Colors are read from the rendered block element so that inherited values
 * (e.g. from Global Styles or ancestor blocks) are taken into account.
 *
 * @param {Object}  props
 * @param {string}  props.clientId          Block client ID.
 * @param {string}  props.name              Block name.
 * @param {boolean} [props.enabled]         Whether contrast checking is active.
 * @param {boolean} [props.checkTextColor]  Whether to evaluate the text/background pair.
 * @param {boolean} [props.checkLinkColor]  Whether to evaluate the link/background pair.
 * @param {string}  [props.messageOverride] Caller-provided copy used in place of the generic guidance.
 *
 * @return {?string} The warning message, if any.
 */
export default function useBlockColorContrastWarning( {
	clientId,
	name,
	enabled = true,
	checkTextColor = true,
	checkLinkColor = true,
	messageOverride,
} ) {
	const blockEl = useBlockElement( clientId );
	const [ colors, setColors ] = useReducer( reducer, {} );

	const blockType = useSelect(
		( select ) => {
			return name && enabled
				? select( blocksStore ).getBlockType( name )
				: undefined;
		},
		[ name, enabled ]
	);

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	useLayoutEffect( () => {
		if ( ! enabled || ! blockEl || ! blockType ) {
			return;
		}

		// Combine `useLayoutEffect` and two rAF calls to ensure that values are read
		// after the current paint but before the next paint.
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( () =>
				setColors( getBlockElementColors( blockEl, blockType ) )
			)
		);
	} );

	// Runs in its own effect with dependencies so the observer is only
	// recreated when the block element or block type changes.
	useLayoutEffect( () => {
		if ( ! enabled || ! blockEl || ! blockType ) {
			return;
		}

		const observer = new window.MutationObserver( () => {
			setColors( getBlockElementColors( blockEl, blockType ) );
		} );

		observer.observe( blockEl, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};
	}, [ enabled, blockEl, blockType ] );

	const warning = enabled
		? getContrastWarning( {
				backgroundColor: colors.backgroundColor,
				textColor: checkTextColor ? colors.textColor : undefined,
				linkColor: checkLinkColor ? colors.linkColor : undefined,
				messageOverride,
				enableAlphaChecker: true,
		  } )
		: null;

	// The popover Notice that displays this warning is muted
	// (`spokenMessage={ null }`), so this hook is the single source of the
	// spoken announcement. Announce only when the warning message itself
	// appears or changes; keying off `speakMessage` rather than the raw
	// computed `colors` avoids re-announcing the same warning when colors
	// recompute without changing the outcome.
	const speakMessage = warning?.speakMessage;
	useEffect( () => {
		if ( speakMessage ) {
			speak( speakMessage );
		}
	}, [ speakMessage ] );

	return warning?.message;
}
