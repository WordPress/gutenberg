/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
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

export const EFFECTS_SUPPORT_KEYS = [ 'shadow' ];

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
	const onChange = ( newShadow ) => {
		setAttributes( styleToAttributes( newShadow ) );
	};
	const blockAttributes = useSelect(
		( select ) => select( blockEditorStore ).getBlockAttributes( clientId ),
		[ clientId ]
	);
	const shadow = blockAttributes?.shadow;
	const value = useMemo( () => attributesToStyle( { shadow } ), [ shadow ] );

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

function styleToAttributes( style ) {
	const shadowValue = style?.shadow;
	const shadowSlug = shadowValue?.startsWith( 'var:preset|shadow|' )
		? shadowValue.substring( 'var:preset|shadow|'.length )
		: undefined;

	return {
		style: undefined, // TODO: check for style prop, and return it if it exists
		shadow: shadowSlug,
	};
}

function attributesToStyle( attributes ) {
	return {
		shadow: attributes.shadow
			? 'var:preset|shadow|' + attributes.shadow
			: undefined,
	};
}
