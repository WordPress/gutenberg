/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { useEffect, useCallback, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { optimizeFitText } from '../utils/fit-text-utils';
import { store as blockEditorStore } from '../store';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import InspectorControls from '../components/inspector-controls';

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
	const isApplyingRef = useRef( false );
	const isFirstCalculationRef = useRef( true );
	const delayTimeoutRef = useRef( null );

	// Monitor block attribute changes
	// Any attribute may change the available space.
	const blockAttributes = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return;
			}
			return select( blockEditorStore ).getBlockAttributes( clientId );
		},
		[ clientId ]
	);

	const applyFitText = useCallback( () => {
		if ( ! blockElement || ! hasFitTextSupport || ! fitText ) {
			return;
		}

		// Prevent infinite loop from ResizeObserver triggering during our own changes
		if ( isApplyingRef.current ) {
			return;
		}

		// Clear any existing delay timeout
		if ( delayTimeoutRef.current ) {
			clearTimeout( delayTimeoutRef.current );
			delayTimeoutRef.current = null;
		}

		// Always delay to let DOM settle (placeholders, etc)
		delayTimeoutRef.current = setTimeout( () => {
			delayTimeoutRef.current = null;
			performCalculation();
		}, 100 );
	}, [ blockElement, clientId, hasFitTextSupport, fitText ] );

	const performCalculation = useCallback( () => {
		if ( ! blockElement || ! hasFitTextSupport || ! fitText ) {
			return;
		}

		isApplyingRef.current = true;

		// Get or create style element with unique ID
		const styleId = `fit-text-${ clientId }`;
		let styleElement = blockElement.ownerDocument.getElementById( styleId );
		if ( ! styleElement ) {
			styleElement = blockElement.ownerDocument.createElement( 'style' );
			styleElement.id = styleId;
			blockElement.ownerDocument.head.appendChild( styleElement );
		}

		const blockSelector = `#block-${ clientId }`;

		// Store the current font size before calculation
		const computedStyle = window.getComputedStyle( blockElement );
		const currentFontSize = parseFloat( computedStyle.fontSize );

		// Run calculation without transitions (applyStylesFn will be called during binary search)
		const applyStylesFn = ( css ) => {
			// No transition during binary search calculation
			styleElement.textContent = css;
		};

		const finalFontSize = optimizeFitText(
			blockElement,
			blockSelector,
			applyStylesFn
		);

		// Check if this is the first calculation (initial load)
		const isFirstCalculation = isFirstCalculationRef.current;
		if ( isFirstCalculation ) {
			isFirstCalculationRef.current = false;
		}

		if ( isFirstCalculation ) {
			// First load: no animation, instant sizing
			styleElement.textContent = `${ blockSelector } { font-size: ${ finalFontSize }px !important; }`;
			isApplyingRef.current = false;
		} else {
			// All subsequent changes: animate from current to final size
			// Reset to current size without transition
			styleElement.textContent = `${ blockSelector } { font-size: ${ currentFontSize }px !important; }`;

			// Use two requestAnimationFrame to ensure browser renders the reset
			requestAnimationFrame( () => {
				requestAnimationFrame( () => {
					// Now apply the final size with transition
					const transitionRule = `${ blockSelector } { transition: font-size 1s ease-out; }`;
					styleElement.textContent =
						transitionRule +
						'\n' +
						`${ blockSelector } { font-size: ${ finalFontSize }px !important; }`;

					// Reset the flag after transition completes
					setTimeout( () => {
						isApplyingRef.current = false;
					}, 1050 ); // Slightly longer than transition duration
				} );
			} );
		}
		},
		[ blockElement, clientId, hasFitTextSupport, fitText ]
	);

	useEffect( () => {
		if (
			! fitText ||
			! blockElement ||
			! clientId ||
			! hasFitTextSupport
		) {
			return;
		}

		// Apply initially
		applyFitText();

		// Store current element value for cleanup
		const currentElement = blockElement;

		// Watch for size changes
		let resizeObserver;
		if ( window.ResizeObserver && currentElement.parentElement ) {
			resizeObserver = new window.ResizeObserver( applyFitText );
			resizeObserver.observe( currentElement.parentElement );
		}

		// Cleanup function
		return () => {
			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}

			// Clear any pending delay timeout
			if ( delayTimeoutRef.current ) {
				clearTimeout( delayTimeoutRef.current );
				delayTimeoutRef.current = null;
			}

			const styleId = `fit-text-${ clientId }`;
			const styleElement =
				currentElement.ownerDocument.getElementById( styleId );
			if ( styleElement ) {
				styleElement.remove();
			}
		};
	}, [ fitText, clientId, applyFitText, blockElement, hasFitTextSupport ] );

	// Trigger fit text recalculation when content changes
	useEffect( () => {
		if ( fitText && blockElement && hasFitTextSupport ) {
			let throttleTimer = null;
			let debounceTimer = null;
			let idleCallbackId = null;

			// Clear any existing timers
			const clearTimers = () => {
				if ( throttleTimer ) {
					clearTimeout( throttleTimer );
					throttleTimer = null;
				}
				if ( debounceTimer ) {
					clearTimeout( debounceTimer );
					debounceTimer = null;
				}
				if ( idleCallbackId && window.cancelIdleCallback ) {
					window.cancelIdleCallback( idleCallbackId );
					idleCallbackId = null;
				}
				// Clear any pending delay timeout
				if ( delayTimeoutRef.current ) {
					clearTimeout( delayTimeoutRef.current );
					delayTimeoutRef.current = null;
				}
			};

			// Run calculation when browser is idle
			const scheduleIdleCalculation = () => {
				clearTimers();

				if ( window.requestIdleCallback ) {
					idleCallbackId = window.requestIdleCallback(
						() => {
							if ( blockElement ) {
								applyFitText();
							}
						},
						{ timeout: 300 } // Fallback timeout
					);
				} else {
					// Fallback for browsers without requestIdleCallback
					throttleTimer = setTimeout( () => {
						if ( blockElement ) {
							applyFitText();
						}
					}, 300 );
				}

				// Schedule final accurate calculation after changes stop
				debounceTimer = setTimeout( () => {
					if ( blockElement ) {
						applyFitText();
					}
				}, 200 );
			};

			scheduleIdleCalculation();

			return clearTimers;
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
 * Fit text control component for the typography panel.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.clientId      Block client ID.
 * @param {Function} props.setAttributes Function to set block attributes.
 * @param {string}   props.name          Block name.
 * @param {boolean}  props.fitText       Whether fit text is enabled.
 */
export function FitTextControl( {
	clientId,
	fitText = false,
	setAttributes,
	name,
} ) {
	if ( ! hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY ) ) {
		return null;
	}
	return (
		<InspectorControls group="typography">
			<ToolsPanelItem
				hasValue={ () => fitText }
				label={ __( 'Fit text' ) }
				onDeselect={ () => setAttributes( { fitText: undefined } ) }
				resetAllFilter={ () => ( { fitText: undefined } ) }
				panelId={ clientId }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Fit text' ) }
					checked={ fitText }
					onChange={ () =>
						setAttributes( { fitText: ! fitText || undefined } )
					}
					help={
						fitText
							? __( 'Text will resize to fit its container.' )
							: __( 'Resize text to fit its container.' )
					}
				/>
			</ToolsPanelItem>
		</InspectorControls>
	);
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
	edit: FitTextControl,
};
