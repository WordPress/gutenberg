/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { useEffect, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const EMPTY_OBJECT = {};

/**
 * Internal dependencies
 */
import { optimizeFitText } from '../utils/fit-text-utils';
import { store as blockEditorStore } from '../store';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

export const FIT_TEXT_SUPPORT_KEY = 'typography.fitText';

/**
 * Filters registered block settings, extending attributes to include
 * the `fitText` attribute.
 *
 * @param {Object} settings Original block settings.
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, FIT_TEXT_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition.
	if ( settings.attributes?.fitText ) {
		return settings;
	}

	// Add fitText attribute.
	return {
		...settings,
		attributes: {
			...settings.attributes,
			fitText: {
				type: 'boolean',
			},
		},
	};
}

/**
 * Custom hook to handle fit text functionality in the editor.
 *
 * @param {Object}   props          Component props.
 * @param {?boolean} props.fitText  Fit text attribute.
 * @param {string}   props.name     Block name.
 * @param {string}   props.clientId Block client ID.
 */
function useFitText( { fitText, name, clientId } ) {
	const hasFitTextSupport = hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY );
	const blockElement = useBlockElement( clientId );

	// Monitor block attribute changes, and parent changes.
	// Any attribute or parent change may change the available space.
	const { blockAttributes, parentId } = useSelect(
		( select ) => {
			if ( ! clientId || ! hasFitTextSupport || ! fitText ) {
				return EMPTY_OBJECT;
			}
			return {
				blockAttributes:
					select( blockEditorStore ).getBlockAttributes( clientId ),
				parentId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
			};
		},
		[ clientId, hasFitTextSupport, fitText ]
	);

	const applyFitText = useCallback( () => {
		if ( ! blockElement || ! hasFitTextSupport || ! fitText ) {
			return;
		}

		// Get or create style element with unique ID
		const styleId = `fit-text-${ clientId }`;
		let styleElement = blockElement.ownerDocument.getElementById( styleId );
		if ( ! styleElement ) {
			styleElement = blockElement.ownerDocument.createElement( 'style' );
			styleElement.id = styleId;
			blockElement.ownerDocument.head.appendChild( styleElement );
		}

		const blockSelector = `#block-${ clientId }`;

		const applyFontSize = ( fontSize ) => {
			if ( fontSize === 0 ) {
				styleElement.textContent = '';
			} else {
				styleElement.textContent = `${ blockSelector } { font-size: ${ fontSize }px !important; }`;
			}
		};

		optimizeFitText( blockElement, applyFontSize );
	}, [ blockElement, clientId, hasFitTextSupport, fitText ] );

	useEffect( () => {
		if (
			! fitText ||
			! blockElement ||
			! clientId ||
			! hasFitTextSupport
		) {
			return;
		}

		// Store current element value for cleanup
		const currentElement = blockElement;
		const previousVisibility = currentElement.style.visibility;

		// Store IDs for cleanup
		let hideFrameId = null;
		let calculateFrameId = null;
		let showTimeoutId = null;

		// We are hiding the element doing the calculation of fit text
		// and then showing it again to avoid the user noticing a flash of potentially
		// big fitText while the binary search is happening.
		hideFrameId = window.requestAnimationFrame( () => {
			currentElement.style.visibility = 'hidden';
			// Wait for browser to render the hidden state
			calculateFrameId = window.requestAnimationFrame( () => {
				applyFitText();

				// Using a timeout instead of requestAnimationFrame, because
				// with requestAnimationFrame a flash of very high size
				// can still occur although rare.
				showTimeoutId = setTimeout( () => {
					currentElement.style.visibility = previousVisibility;
				}, 10 );
			} );
		} );

		// Watch for size changes
		let resizeObserver;
		if ( window.ResizeObserver && currentElement.parentElement ) {
			resizeObserver = new window.ResizeObserver( applyFitText );
			resizeObserver.observe( currentElement.parentElement );
			resizeObserver.observe( currentElement );
		}

		// Cleanup function
		return () => {
			// Cancel pending async operations
			if ( hideFrameId !== null ) {
				window.cancelAnimationFrame( hideFrameId );
			}
			if ( calculateFrameId !== null ) {
				window.cancelAnimationFrame( calculateFrameId );
			}
			if ( showTimeoutId !== null ) {
				clearTimeout( showTimeoutId );
			}

			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}

			const styleId = `fit-text-${ clientId }`;
			const styleElement =
				currentElement.ownerDocument.getElementById( styleId );
			if ( styleElement ) {
				styleElement.remove();
			}
		};
	}, [
		fitText,
		clientId,
		parentId,
		applyFitText,
		blockElement,
		hasFitTextSupport,
	] );

	// Trigger fit text recalculation when content changes
	useEffect( () => {
		if ( fitText && blockElement && hasFitTextSupport ) {
			// Wait for next frame to ensure DOM has updated after content changes
			const frameId = window.requestAnimationFrame( () => {
				if ( blockElement ) {
					applyFitText();
				}
			} );

			return () => window.cancelAnimationFrame( frameId );
		}
	}, [
		blockAttributes,
		fitText,
		applyFitText,
		blockElement,
		hasFitTextSupport,
	] );
}

/**
 * Override props applied to the block element on save.
 *
 * @param {Object} props      Additional props applied to the block element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 * @return {Object} Filtered props applied to the block element.
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, FIT_TEXT_SUPPORT_KEY ) ) {
		return props;
	}

	const { fitText } = attributes;

	if ( ! fitText ) {
		return props;
	}

	// Add CSS class for frontend detection and styling
	const className = props.className
		? `${ props.className } has-fit-text`
		: 'has-fit-text';

	return {
		...props,
		className,
	};
}
/**
 * Override props applied to the block element in the editor.
 *
 * @param {Object}  props          Component props including block attributes.
 * @param {string}  props.name     Block name.
 * @param {boolean} props.fitText  Whether fit text is enabled.
 * @param {string}  props.clientId Block client ID.
 * @return {Object} Filtered props applied to the block element.
 */
function useBlockProps( { name, fitText, clientId } ) {
	useFitText( { fitText, name, clientId } );
	if ( ! fitText || ! hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY ) ) {
		return {};
	}
	return {
		className: 'has-fit-text',
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/fit-text/addAttribute',
	addAttributes
);

const hasFitTextSupport = ( blockNameOrType ) => {
	return hasBlockSupport( blockNameOrType, FIT_TEXT_SUPPORT_KEY );
};

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fitText' ],
	hasSupport: hasFitTextSupport,
	edit: () => null,
};
