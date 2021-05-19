/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

export default function FontFamilyControl( {
	value = '',
	onChange,
	fontFamilies,
	...props
} ) {
	const blockLevelFontFamilies = useSetting( 'typography.fontFamilies' );
	if ( ! fontFamilies ) {
		fontFamilies = blockLevelFontFamilies;
	}

	if ( isEmpty( fontFamilies ) ) {
		return null;
	}

	const options = [
		{ value: '', label: __( 'Default' ) },
		...fontFamilies.map( ( { fontFamily, name } ) => {
			return {
				value: fontFamily,
				label: name || fontFamily,
			};
		} ),
	];
	return (
		<SelectControl
			label={ __( 'Font family' ) }
			options={ options }
			value={ value }
			onChange={ onChange }
			labelPosition="top"
			{ ...props }
		/>
	);
}
