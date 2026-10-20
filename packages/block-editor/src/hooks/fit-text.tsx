import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useEffect, useCallback, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
const EMPTY_OBJECT: FitTextBlockState = {};
const MIN_FONT_SIZE_FOR_WARNING = 12;
import { optimizeFitText } from '../utils/fit-text-utils';
import { store as blockEditorStore } from '../store';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import InspectorControls from '../components/inspector-controls';
import FitTextSizeWarning from '../components/fit-text-size-warning';
import type { BlockAttributes } from '../store/types';
import type {
	BlockEditHookProps,
	BlockWrapperProps,
	FitTextAttributes,
	FitTextControlProps,
	FitTextFontSizeProps,
	UseFitTextProps,
} from './types';

/**
 * The block state the fit text recalculation depends on.
 */
interface FitTextBlockState {
	blockAttributes?: BlockAttributes | null;
	parentId?: string | null;
	blockMode?: string;
}

export const FIT_TEXT_SUPPORT_KEY = 'typography.fitText';

/**
 * Filters registered block settings, extending attributes to include
 * the `fitText` attribute.
 *
 * @param settings Original block settings.
 * @return Filtered block settings.
 */
function addAttributes( settings: BlockType ): BlockType {
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
 * @param props          Component props.
 * @param props.fitText  Fit text attribute.
 * @param props.name     Block name.
 * @param props.clientId Block client ID.
 */
function useFitText( { fitText, name, clientId }: UseFitTextProps ) {
	const [ fontSize, setFontSize ] = useState< number | null | undefined >(
		null
	);
	const hasFitTextSupport = hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY );
	// Block elements are HTML elements.
	const blockElement = useBlockElement( clientId ) as
		HTMLElement | null | undefined;

	// Monitor block attribute changes, parent changes, and block mode.
	// Any attribute or parent change may change the available space.
	// Block mode is needed to disable fit text when in HTML editing mode.
	const { blockAttributes, parentId, blockMode } = useSelect(
		( select ): FitTextBlockState => {
			if ( ! clientId || ! hasFitTextSupport || ! fitText ) {
				return EMPTY_OBJECT;
			}
			const _blockMode =
				select( blockEditorStore ).getBlockMode( clientId );
			if ( _blockMode === 'html' ) {
				return { blockMode: _blockMode };
			}
			return {
				blockAttributes:
					select( blockEditorStore ).getBlockAttributes( clientId ),
				parentId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
				blockMode: _blockMode,
			};
		},
		[ clientId, hasFitTextSupport, fitText ]
	);

	const applyFitText = useCallback( () => {
		if ( ! blockElement || ! hasFitTextSupport || ! fitText ) {
			return;
		}

		// Size the measured element itself: a block rendered once per item in
		// a loop shares its client ID, so a rule keyed to it would size every
		// copy at once. Mirrors the front end in `fit-text-frontend.ts`.
		const applyFontSizeStyle = ( size: number ) => {
			if ( size === 0 ) {
				blockElement.style.removeProperty( 'font-size' );
			} else {
				blockElement.style.setProperty( 'font-size', `${ size }px` );
			}
		};

		const optimalSize = optimizeFitText( blockElement, applyFontSizeStyle );
		setFontSize( optimalSize );
	}, [ blockElement, hasFitTextSupport, fitText ] );

	useEffect( () => {
		if (
			! fitText ||
			! blockElement ||
			! clientId ||
			! hasFitTextSupport ||
			blockMode === 'html'
		) {
			return;
		}

		// Store current element value for cleanup
		const currentElement = blockElement;
		const previousVisibility = currentElement.style.visibility;

		// Store IDs for cleanup
		let hideFrameId: number | null = null;
		let calculateFrameId: number | null = null;
		let showTimeoutId: ReturnType< typeof setTimeout > | null = null;

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
		let resizeObserver: ResizeObserver | undefined;
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

			currentElement.style.removeProperty( 'font-size' );
		};
	}, [
		fitText,
		clientId,
		parentId,
		applyFitText,
		blockElement,
		hasFitTextSupport,
		blockMode,
	] );

	// Trigger fit text recalculation when content changes
	useEffect( () => {
		if (
			fitText &&
			blockElement &&
			hasFitTextSupport &&
			blockMode !== 'html'
		) {
			// Wait for next frame to ensure DOM has updated after content changes
			const frameId = window.requestAnimationFrame( () => {
				if ( blockElement ) {
					applyFitText();
				}
			} );

			return () => window.cancelAnimationFrame( frameId );
		}
		return undefined;
	}, [
		blockAttributes,
		fitText,
		applyFitText,
		blockElement,
		hasFitTextSupport,
		blockMode,
	] );

	return { fontSize };
}

/**
 * Fit text control component for the typography panel.
 *
 * @param props               Component props.
 * @param props.clientId      Block client ID.
 * @param props.setAttributes Function to set block attributes.
 * @param props.name          Block name.
 * @param props.fitText       Whether fit text is enabled.
 * @param props.fontSize      Font size slug.
 * @param props.style         Block style object.
 */
export function FitTextControl( {
	clientId,
	fitText = false,
	setAttributes,
	name,
	fontSize,
	style,
}: FitTextControlProps ) {
	const hasSelectedBlockStyleState = useSelect(
		( select ) => {
			const {
				hasSelectedBlockStyleState: hasSelectedBlockStyleStateSelector,
			} = select( blockEditorStore );

			return hasSelectedBlockStyleStateSelector( clientId );
		},
		[ clientId ]
	);

	if ( ! hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY ) ) {
		return null;
	}

	if ( hasSelectedBlockStyleState ) {
		return null;
	}

	return (
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
					const updates: FitTextAttributes = { fitText: newFitText };

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
		</ToolsPanelItem>
	);
}

/**
 * Override props applied to the block element on save.
 *
 * @param props      Additional props applied to the block element.
 * @param blockType  Block type.
 * @param attributes Block attributes.
 * @return Filtered props applied to the block element.
 */
function addSaveProps(
	props: BlockWrapperProps,
	blockType: BlockType,
	attributes: FitTextAttributes
) {
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
 * @param props         Component props including block attributes.
 * @param props.name    Block name.
 * @param props.fitText Whether fit text is enabled.
 * @return Filtered props applied to the block element.
 */
function useBlockProps( {
	name,
	fitText,
}: Pick< UseFitTextProps, 'name' | 'fitText' > ) {
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

const hasFitTextSupport = ( blockNameOrType: string | BlockType ) => {
	return hasBlockSupport( blockNameOrType, FIT_TEXT_SUPPORT_KEY );
};

/**
 * Component that handles the fit text font size and displays a warning
 * if the fit text font size is below a minimum threshold.
 *
 * @param props            Component props.
 * @param props.fitText    Whether fit text is enabled.
 * @param props.name       Block name.
 * @param props.clientId   Block client ID.
 * @param props.isSelected Whether the block is selected.
 * @return Warning component or null.
 */
function FitTextFontSize( {
	fitText,
	name,
	clientId,
	isSelected,
}: FitTextFontSizeProps ) {
	const { fontSize } = useFitText( { fitText, name, clientId } );
	if ( isSelected && fontSize && fontSize < MIN_FONT_SIZE_FOR_WARNING ) {
		return (
			<InspectorControls group="typography">
				<FitTextSizeWarning />
			</InspectorControls>
		);
	}
	return null;
}

/*
 * Fit-text requires that layout calculations be done even when a block is not
 * currently selected. Therefore, the regular hooking approach using an
 * exported `edit` method is not enough, and we must use this HoC with the
 * `editor.BlockEdit` filter.
 */
const addFitTextControl = createHigherOrderComponent( ( BlockEdit ) => {
	return function AddFitTextControl( props: BlockEditHookProps ) {
		const { name, attributes, clientId, isSelected, setAttributes } = props;
		// The block attributes include the fit text attributes.
		const { fitText } = attributes as FitTextAttributes;
		const supportsFitText = hasBlockSupport( name, FIT_TEXT_SUPPORT_KEY );
		if ( ! supportsFitText ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls group="typography">
					<FitTextControl
						clientId={ clientId }
						fitText={ fitText }
						setAttributes={ setAttributes }
						name={ name }
						fontSize={
							( attributes as FitTextAttributes ).fontSize
						}
						style={ ( attributes as FitTextAttributes ).style }
					/>
				</InspectorControls>
				{ fitText && (
					<FitTextFontSize
						fitText={ fitText }
						name={ name }
						clientId={ clientId }
						isSelected={ isSelected }
					/>
				) }
			</>
		);
	};
}, 'addFitTextControl' );

addFilter(
	'editor.BlockEdit',
	'core/fit-text/add-fit-text-control',
	addFitTextControl
);

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fitText', 'fontSize', 'style' ],
	hasSupport: hasFitTextSupport,
	edit: () => null,
};
