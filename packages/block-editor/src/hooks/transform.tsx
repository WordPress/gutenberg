import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import InspectorControls from '../components/inspector-controls';
import {
	TransformPanel as StylesTransformPanel,
	useHasTransformPanel,
} from '../components/global-styles';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { store as blockEditorStore } from '../store';
import { cleanEmptyObject } from './utils';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import type { PanelStyle } from '../components/global-styles/types';
import type {
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
	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	if ( ! isEnabled ) {
		return null;
	}

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
			defaultControls={ { rotate: false, ...defaultControls } }
			inheritedValue={ inheritedValue }
		/>
	);
}
