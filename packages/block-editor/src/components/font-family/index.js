/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

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
} ) {
	const [ blockLevelFontFamilies ] = useSettings( 'typography.fontFamilies' );
	if ( ! fontFamilies ) {
		fontFamilies = blockLevelFontFamilies;
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
			__next40pxDefaultSize
			label={ __( 'Font' ) }
			value={ selectedValue }
			onChange={ ( { selectedItem } ) => onChange( selectedItem.key ) }
			options={ options }
			className={ clsx( 'block-editor-font-family-control', className ) }
			{ ...props }
		/>
	);
}
