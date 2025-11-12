/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
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

	if (
		! __next40pxDefaultSize &&
		( props.size === undefined || props.size === 'default' )
	) {
		deprecated(
			`36px default size for wp.blockEditor.__experimentalFontFamilyControl`,
			{
				since: '6.8',
				version: '7.1',
				hint: 'Set the `__next40pxDefaultSize` prop to true to start opting into the new default size, which will become the default in a future version.',
			}
		);
	}

	const selectedValue =
		options.find( ( option ) => option.key === value ) ?? '';
	return (
		<CustomSelectControl
			__next40pxDefaultSize={ __next40pxDefaultSize }
			__shouldNotWarnDeprecated36pxSize
			label={ __( 'Font' ) }
			value={ selectedValue }
			onChange={ ( { selectedItem } ) => onChange( selectedItem.key ) }
			options={ options }
			className={ clsx( 'block-editor-font-family-control', className, {
				'is-next-has-no-margin-bottom': __nextHasNoMarginBottom,
			} ) }
			{ ...props }
		/>
	);
}
