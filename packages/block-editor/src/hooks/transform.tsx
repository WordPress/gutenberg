import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import TokenList from '@wordpress/token-list';
import InspectorControls from '../components/inspector-controls';
import {
	TransformPanel as StylesTransformPanel,
	useHasTransformPanel,
} from '../components/global-styles';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { store as blockEditorStore } from '../store';
import { cleanEmptyObject, shouldSkipSerialization } from './utils';
import { getTransformClassesAndStyles } from './use-transform-props';
import {
	getStyleForState,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import type { PanelStyle } from '../components/global-styles/types';
import type {
	BlockStyleState,
	ResetAllFilter,
	StyleInspectorControlProps,
	TransformAttributes,
	TransformHookPanelProps,
} from './types';

export const TRANSFORM_SUPPORT_KEY = 'transform';

function TransformInspectorControl( {
	children,
	resetAllFilter,
}: StyleInspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: TransformAttributes ) => {
			const existingStyle = attributes.style;
			const updatedStyle = resetAllFilter( existingStyle );
			return {
				...attributes,
				style: updatedStyle,
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="transform"
			// The filter reads the style attribute.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

/**
 * Returns the inherited value the Transform panel shows for a block state.
 * Each transform comes from the block styles the state renders over, else
 * from Global Styles.
 *
 * @param resolvedValue Global Styles value resolved for the state.
 * @param style         The block styles.
 * @param selectedState Selected block style state.
 *
 * @return Inherited value for the panel.
 */
export function getStateInheritedValue(
	resolvedValue: PanelStyle | undefined,
	style: PanelStyle | undefined,
	selectedState: BlockStyleState
): PanelStyle {
	const { viewport, pseudo } = selectedState;
	// Ordered from the lowest to the highest priority.
	const layers = [ style ];
	if (
		hasViewportBlockStyleState( selectedState ) &&
		hasPseudoBlockStyleState( selectedState )
	) {
		layers.push(
			style?.[ viewport as string ] as PanelStyle | undefined,
			style?.[ pseudo as string ] as PanelStyle | undefined
		);
	}

	const transform: Record< string, unknown > = {
		...resolvedValue?.transform,
	};
	for ( const layer of layers ) {
		const layerTransform = layer?.transform;
		if ( ! layerTransform || typeof layerTransform !== 'object' ) {
			continue;
		}
		for ( const [ key, layerValue ] of Object.entries( layerTransform ) ) {
			if ( layerValue === undefined || layerValue === null ) {
				continue;
			}
			// Translate axes layer one by one, as in the CSS.
			transform[ key ] =
				key === 'translate' && typeof layerValue === 'object'
					? {
							...( transform.translate as object | undefined ),
							...layerValue,
						}
					: layerValue;
		}
	}

	return { ...resolvedValue, transform } as PanelStyle;
}

export function TransformPanel( {
	clientId,
	name,
	setAttributes,
	settings,
}: TransformHookPanelProps ) {
	const selectedState = useBlockStyleState();
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const isEnabled = useHasTransformPanel( settings );
	const { style, className }: TransformAttributes = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled
			if ( ! isEnabled ) {
				return {};
			}
			const attributes = ( select( blockEditorStore ).getBlockAttributes(
				clientId
				// The block's attributes hold its styles.
			) || {} ) as TransformAttributes;
			return {
				style: attributes.style,
				className: attributes.className,
			};
		},
		[ clientId, isEnabled ]
	);
	const { value: resolvedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	if ( ! isEnabled ) {
		return null;
	}

	const inheritedValue = isStateSelected
		? getStateInheritedValue( resolvedValue, style, selectedState )
		: resolvedValue;
	const value = isStateSelected
		? // The state styles have the shape of the block styles.
			( getStyleForState( style, selectedState ) as
				PanelStyle | undefined )
		: style;
	const onChange = ( newStyle: PanelStyle ) => {
		setAttributes( {
			style: isStateSelected
				? setStyleForState( style, selectedState, newStyle )
				: cleanEmptyObject( newStyle ),
		} );
	};

	// The default controls map control names to whether they show.
	const defaultControls = getBlockSupport( name, [
		TRANSFORM_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;

	return (
		<StylesTransformPanel
			as={ TransformInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			// Unlike Global Styles, the block inspector hides a control
			// unless the block shows it by default.
			defaultControls={ {
				rotate: false,
				translate: false,
				scale: false,
				...defaultControls,
			} }
			inheritedValue={ inheritedValue }
		/>
	);
}

/**
 * Adds the transform support class names to the props of a saved block.
 *
 * @param props      Additional props applied to the save element.
 * @param blockType  Block type or name.
 * @param attributes Block attributes.
 * @return Filtered props applied to the save element.
 */
function addSaveProps(
	props: Record< string, unknown >,
	blockType: string | BlockType,
	attributes: TransformAttributes
) {
	// Mirror of the skipped style in `addSaveProps()` of `./style`.
	if (
		shouldSkipSerialization( blockType, TRANSFORM_SUPPORT_KEY, 'rotate' ) ||
		getBlockSupport(
			blockType,
			[ TRANSFORM_SUPPORT_KEY, 'fitContent' ],
			true
		) === false
	) {
		return props;
	}

	const { className } = getTransformClassesAndStyles( attributes );
	if ( ! className ) {
		return props;
	}

	const classes = new TokenList( props.className as string | undefined );
	classes.add( className );

	return { ...props, className: classes.value };
}

function useBlockProps( {
	name,
	style,
}: TransformAttributes & { name: string } ) {
	return addSaveProps( {}, name, { style } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'style' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, TRANSFORM_SUPPORT_KEY );
	},
};
