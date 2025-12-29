/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { useEffect, useCallback, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';

const EMPTY_OBJECT = {};
const MIN_FONT_SIZE_FOR_WARNING = 6;

/**
 * Internal dependencies
 */
import { optimizeFitText } from '../utils/fit-text-utils';
import { store as blockEditorStore } from '../store';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import InspectorControls from '../components/inspector-controls';
import FitTextSizeWarning from '../components/fit-text-size-warning';

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
	const [ fontSize, setFontSize ] = useState( null );
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

		const applyFontSizeStyle = ( size ) => {
			if ( size === 0 ) {
				styleElement.textContent = '';
			} else {
				styleElement.textContent = `${ blockSelector } { font-size: ${ size }px !important; }`;
			}
		};

		const optimalSize = optimizeFitText( blockElement, applyFontSizeStyle );
		setFontSize( optimalSize );
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

	return { fontSize };
}

/**
 * Fit text control component for the typography panel.
 *
 * @param {Object}      props               Component props.
 * @param {string}      props.clientId      Block client ID.
 * @param {Function}    props.setAttributes Function to set block attributes.
 * @param {string}      props.name          Block name.
 * @param {boolean}     props.fitText       Whether fit text is enabled.
 * @param {string}      props.fontSize      Font size slug.
 * @param {Object}      props.style         Block style object.
 * @param {JSX.Element} props.warning       Warning component to display.
 */
export function FitTextControl( {
	clientId,
	fitText = false,
	setAttributes,
	name,
	fontSize,
	style,
	warning,
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
					label={ __( 'Fit text' ) }
					checked={ fitText }
					onChange={ () => {
						const newFitText = ! fitText || undefined;
						const updates = { fitText: newFitText };

						// When enabling fit text, clear font size if it has a value
						if ( newFitText ) {
							if ( fontSize ) {
								updates.fontSize = undefined;
							}
							if ( style?.typography?.fontSize ) {
								updates.style = {
									...style,
									typography: {
										...style?.typography,
										fontSize: undefined,
									},
								};
							}
						}

						setAttributes( updates );
					} }
					help={
						fitText
							? __( 'Text will resize to fit its container.' )
							: __(
									'The text will resize to fit its container, resetting other font size settings.'
							  )
					}
				/>
				{ warning }
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
 * @param {Object}  props         Component props including block attributes.
 * @param {string}  props.name    Block name.
 * @param {boolean} props.fitText Whether fit text is enabled.
 * @return {Object} Filtered props applied to the block element.
 */
function useBlockProps( { name, fitText } ) {
	if ( fitText && hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY ) ) {
		return {
			className: 'has-fit-text',
		};
	}
	return {};
}

addFilter(
	'blocks.registerBlockType',
	'core/fit-text/addAttribute',
	addAttributes
);

const hasFitTextSupport = ( blockNameOrType ) => {
	return hasBlockSupport( blockNameOrType, FIT_TEXT_SUPPORT_KEY );
};

function FitTextEdit( props ) {
	const { name, attributes, clientId, isSelected, setAttributes } = props;
	const { fitText } = attributes;
	const { fontSize } = useFitText( { fitText, name, clientId } );

	return (
		isSelected && (
			<FitTextControl
				clientId={ clientId }
				fitText={ fitText }
				setAttributes={ setAttributes }
				name={ name }
				fontSize={ attributes.fontSize }
				style={ attributes.style }
				warning={
					fontSize < MIN_FONT_SIZE_FOR_WARNING && (
						<FitTextSizeWarning />
					)
				}
			/>
		)
	);
}

/**
 * Higher-order component that when fit text is enabled,
 * adds the FitTextEdit component to the block's edit interface.
 * We could not use the expored edit component because, we need
 * this to added even when the block is not selected to ensure
 * the fit text calculations are done.
 */
const withFitTextEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { name, attributes, clientId, isSelected, setAttributes } = props;
		const { fitText } = attributes;
		const supportsFitText = hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY );
		if ( ! supportsFitText ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<>
				<BlockEdit { ...props } />
				{ fitText && (
					<FitTextEdit
						clientId={ clientId }
						fitText={ fitText }
						setAttributes={ props.setAttributes }
						name={ name }
						attributes={ attributes }
						isSelected={ isSelected }
					/>
				) }
				{ ! fitText && isSelected && (
					<FitTextControl
						clientId={ clientId }
						fitText={ fitText }
						setAttributes={ setAttributes }
						name={ name }
						fontSize={ attributes.fontSize }
						style={ attributes.style }
					/>
				) }
			</>
		);
	};
}, 'withFitTextEdit' );

addFilter(
	'editor.BlockEdit',
	'core/fit-text/with-fit-text-edit',
	withFitTextEdit
);

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fitText', 'fontSize', 'style' ],
	hasSupport: hasFitTextSupport,
	edit: () => null,
};
