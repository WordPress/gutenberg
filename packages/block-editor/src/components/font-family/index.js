/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

export default function FontFamilyControl( {
	/** Start opting into the larger default height that will become the default size in a future version. */
	__next40pxDefaultSize = false,
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMarginBottom = false,
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
		{ value: '', label: __( 'Default' ) },
		...fontFamilies.map( ( { fontFamily, name } ) => {
			return {
				value: fontFamily,
				label: name || fontFamily,
			};
		} ),
	];

	if ( ! __nextHasNoMarginBottom ) {
		deprecated(
			'Bottom margin styles for wp.blockEditor.FontFamilyControl',
			{
				since: '6.7',
				version: '7.0',
				hint: 'Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version',
			}
		);
	}

	return (
		<SelectControl
			__next40pxDefaultSize={ __next40pxDefaultSize }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			label={ __( 'Font' ) }
			options={ options }
			value={ value }
			onChange={ onChange }
			labelPosition="top"
			{ ...props }
		/>
	);
}
