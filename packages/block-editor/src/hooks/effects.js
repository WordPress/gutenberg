/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import StylesEffectsPanel, {
	useHasEffectsPanel,
} from '../components/global-styles/effects-panel';
import { InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';
import { cleanEmptyObject } from './utils';

export const SHADOW_SUPPORT_KEY = 'shadow';
export const EFFECTS_SUPPORT_KEYS = [ SHADOW_SUPPORT_KEY ];

export function hasEffectsSupport( blockName ) {
	return EFFECTS_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
}

function EffectsInspectorControl( { children, resetAllFilter } ) {
	return (
		<InspectorControls group="effects" resetAllFilter={ resetAllFilter }>
			{ children }
		</InspectorControls>
	);
}
export function EffectsPanel( { clientId, setAttributes, settings } ) {
	const isEnabled = useHasEffectsPanel( settings );
	const value = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style,
		[ clientId ]
	);

	const onChange = ( newStyle ) => {
		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	if ( ! isEnabled ) {
		return null;
	}

	return (
		<StylesEffectsPanel
			as={ EffectsInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
		/>
	);
}
