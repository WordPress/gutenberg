/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';

export const FONT_WEIGHT_SUPPORT_KEY = '__experimentalFontWeight';

const FONT_WEIGHT_OPTIONS = [
	{ value: '', label: __( 'Default' ) },
	{ value: 'normal', label: __( 'Normal' ) },
	{ value: 'bold', label: __( 'Bold' ) },
	{ value: 'lighter', label: __( 'Lighter' ) },
	{ value: 'bolder', label: __( 'Bolder' ) },
	...[ ...Array( 9 ).keys() ]
		.map( ( i ) => ( i + 1 ) * 100 )
		.map( ( weight ) => ( { value: weight, label: weight } ) ),
	{ value: 'initial', label: __( 'Initial' ) },
	{ value: 'inherit', label: __( 'Inherit' ) },
];

function FontWeightControl( { value = '', onChange, ...props } ) {
	return (
		<SelectControl
			label={ __( 'Font weight' ) }
			options={ FONT_WEIGHT_OPTIONS }
			value={ value }
			onChange={ onChange }
			{ ...props }
		/>
	);
}

export function FontWeightEdit( {
	name,
	setAttributes,
	attributes: { style = {} },
} ) {
	const isDisable = useIsFontWeightDisabled( { name } );

	if ( isDisable ) {
		return null;
	}

	const fontWeight = style.typography?.fontWeight || '';

	function onChange( newValue ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...( style.typography || {} ),
					fontWeight: newValue || undefined,
				},
			} ),
		} );
	}

	return (
		<FontWeightControl
			className="block-editor-hooks-font-weight-control"
			value={ fontWeight }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if font-family functionality is disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsFontWeightDisabled( { name } ) {
	return (
		useSelect( ( select ) => {
			const editorSettings = select( 'core/block-editor' ).getSettings();
			return !! editorSettings.__experimentalGlobalStylesBase?.global
				.features?.typography?.fontWeight;
		} ) || ! hasBlockSupport( name, FONT_WEIGHT_SUPPORT_KEY )
	);
}
