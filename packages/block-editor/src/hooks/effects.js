/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import StylesEffectsPanel, {
	useHasEffectsPanel,
} from '../components/global-styles/effects-panel';
import { InspectorControls } from '../components';

export const EFFECTS_SUPPORT_KEYS = [ 'shadow' ];

export function hasEffectsSupport( blockName ) {
	return EFFECTS_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
}

function EffectsInspectorControl( { children } ) {
	return <InspectorControls group="effects">{ children }</InspectorControls>;
}

export function EffectsPanel( { clientId, name, setAttributes, settings } ) {
	const isEnabled = useHasEffectsPanel( settings );

	const onChange = ( newShadow ) => {
		setAttributes( {
			shadow: newShadow,
		} );
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultControls = getBlockSupport( name, [
		'shadow',
		'__experimentalDefaultControls',
	] );

	return (
		<StylesEffectsPanel
			as={ EffectsInspectorControl }
			paneldId={ clientId }
			settings={ settings }
			value={ settings.shadow }
			onChange={ onChange }
			defaultControls={ defaultControls }
		/>
	);
}
