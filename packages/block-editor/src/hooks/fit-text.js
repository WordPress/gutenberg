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

	// Monitor block attribute changes and selection state
	// Any attribute may change the available space.
	const { blockAttributes, isSelected } = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return { blockAttributes: undefined, isSelected: false };
			}
			return {
				blockAttributes:
					select( blockEditorStore ).getBlockAttributes( clientId ),
				isSelected:
					select( blockEditorStore ).isBlockSelected( clientId ),
			};
		},
		[ clientId ]
	);

	const isSelectedRef = useRef();
	useEffect( () => {
		isSelectedRef.current = isSelected;
	}, [ isSelected ] );

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

		const applyStylesFn = ( css ) => {
			styleElement.textContent = css;
		};

		// Avoid very jarring resizes when a user is actively editing the
		// block. Placing a ceiling on how much the block can grow curbs the
		// effect of the first few keypresses.
		const maxSize = isSelectedRef.current ? 200 : undefined;

		optimizeFitText( blockElement, blockSelector, applyStylesFn, maxSize );
	}, [ blockElement, clientId, hasFitTextSupport, fitText, isSelectedRef ] );

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
		isSelected,
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
