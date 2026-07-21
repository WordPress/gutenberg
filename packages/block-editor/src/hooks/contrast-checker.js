/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useReducer,
	useRef,
} from '@wordpress/element';
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

	// Re-read the block's rendered colors and update state. The FIRST read
	// (e.g. opening the picker on an already-poor color) runs immediately.
	// While a pointer is held down — most importantly dragging in the color
	// picker, which changes the block's color on every pointer move — the read
	// is deferred and then runs the instant the pointer is released. This keeps
	// the contrast notice from flashing on and off mid-drag (which resizes the
	// color popover and makes the picker handle jump), while still showing the
	// result the moment the user settles on a color, with no timer-based delay.
	const hasReadRef = useRef( false );
	const isPointerDownRef = useRef( false );
	const pendingReadRef = useRef( false );

	const readColors = useCallback( () => {
		if ( ! blockEl || ! blockType ) {
			return;
		}
		setColors( getBlockElementColors( blockEl, blockType ) );
	}, [ blockEl, blockType ] );

	const scheduleRead = useCallback( () => {
		if ( ! hasReadRef.current ) {
			hasReadRef.current = true;
			readColors();
			return;
		}
		// A drag is in progress; hold off until the pointer is released.
		if ( isPointerDownRef.current ) {
			pendingReadRef.current = true;
			return;
		}
		readColors();
	}, [ readColors ] );

	// Track whether a pointer is pressed anywhere (e.g. a color-picker drag),
	// and flush any deferred read the instant it is released.
	useEffect( () => {
		const handlePointerDown = () => {
			isPointerDownRef.current = true;
		};
		const handlePointerUp = () => {
			isPointerDownRef.current = false;
			if ( ! pendingReadRef.current ) {
				return;
			}
			pendingReadRef.current = false;
			// Let the final color commit to the DOM before reading it.
			window.requestAnimationFrame( () => readColors() );
		};
		window.addEventListener( 'pointerdown', handlePointerDown, true );
		window.addEventListener( 'pointerup', handlePointerUp, true );
		window.addEventListener( 'pointercancel', handlePointerUp, true );
		return () => {
			window.removeEventListener(
				'pointerdown',
				handlePointerDown,
				true
			);
			window.removeEventListener( 'pointerup', handlePointerUp, true );
			window.removeEventListener(
				'pointercancel',
				handlePointerUp,
				true
			);
		};
	}, [ readColors ] );

	// There are so many things that can change the color of a block, so we
	// re-check on every render (deferred to after the current paint but before
	// the next, via two rAFs).
	useLayoutEffect( () => {
		if ( ! enabled || ! blockEl || ! blockType ) {
			return;
		}

		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( () => scheduleRead() )
		);
	} );

	// Watch the block element for the class/style changes a live edit makes.
	// Recreated only when the block element or block type changes; on that
	// change the next read is immediate again, while the observer's own
	// mid-drag churn is deferred to pointer release through `scheduleRead`.
	useLayoutEffect( () => {
		if ( ! enabled || ! blockEl || ! blockType ) {
			return;
		}

		hasReadRef.current = false;

		const observer = new window.MutationObserver( () => scheduleRead() );

		observer.observe( blockEl, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};
	}, [ enabled, blockEl, blockType, scheduleRead ] );

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
