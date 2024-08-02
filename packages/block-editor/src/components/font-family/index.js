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
	value = '',
	onChange,
	fontFamilies,
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
		{ key: '', name: __( 'Default' ) },
		...fontFamilies.map( ( { fontFamily, name } ) => {
			return {
				key: fontFamily,
				name: name || fontFamily,
			};
		} ),
	];

	return (
		<CustomSelectControl
			label={ __( 'Font' ) }
			options={ options }
			value={ options.find( ( { key } ) => key === value ) }
			onChange={ ( { selectedItem } ) => onChange( selectedItem.key ) }
			{ ...props }
		/>
	);
}
