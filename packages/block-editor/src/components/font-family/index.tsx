import clsx from 'clsx';
import { CustomSelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';
import { useSettings } from '../use-settings';
import type { FontFamilyControlProps } from './types';

export default function FontFamilyControl( {
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
	 */
	__next40pxDefaultSize: _next40pxDefaultSize,
	value = '',
	onChange,
	fontFamilies,
	className,
	...props
}: FontFamilyControlProps ) {
	const [ blockLevelFontFamilies ] = useSettings( 'typography.fontFamilies' );
	if ( ! fontFamilies ) {
		// The setting lists the font family presets.
		fontFamilies = blockLevelFontFamilies as FontFamilyPreset[] | undefined;
	}

	if ( ! fontFamilies || fontFamilies.length === 0 ) {
		return null;
	}

	const options = [
		{
			key: '',
			name: __( 'Default' ),
		},
		...fontFamilies.map( ( { fontFamily, name } ) => ( {
			key: fontFamily,
			name: name || fontFamily,
			style: { fontFamily },
		} ) ),
	];

	const selectedValue =
		options.find( ( option ) => option.key === value ) ?? '';
	return (
		<CustomSelectControl
			label={ __( 'Font' ) }
			// As before, an unmatched value is passed as an empty string.
			value={ selectedValue as ( typeof options )[ number ] }
			onChange={ ( { selectedItem } ) => onChange( selectedItem.key ) }
			options={ options }
			className={ clsx( 'block-editor-font-family-control', className ) }
			{ ...props }
		/>
	);
}
