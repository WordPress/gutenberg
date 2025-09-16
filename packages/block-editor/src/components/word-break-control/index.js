/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CustomSelectControl } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';

export default function WordBreakControl( {
	/** Start opting into the larger default height that will become the default size in a future version. */
	__next40pxDefaultSize = false,
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMarginBottom = false,
	value = '',
	onChange,
	className,
	...props
} ) {
	const options = [
		{
			key: '',
			name: __( 'Default' ),
		},
		{
			key: 'normal',
			name: __( 'Normal' ),
		},
		{
			key: 'break-all',
			name: __( 'Break all' ),
		},
		{
			key: 'keep-all',
			name: __( 'Keep all' ),
		},
		{
			key: 'break-word',
			name: __( 'Break word' ),
		},
		{
			key: 'auto-phrase',
			name: __( 'Auto phrase' ),
		},
	];

	if ( ! __nextHasNoMarginBottom ) {
		deprecated(
			'Bottom margin styles for wp.blockEditor.WordBreakControl',
			{
				since: '6.8.3',
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
			`36px default size for wp.blockEditor.__experimentalWordBreakControl`,
			{
				since: '6.8.3',
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
			label={ __( 'Word break' ) }
			value={ selectedValue }
			onChange={ ( { selectedItem } ) => onChange( selectedItem.key ) }
			options={ options }
			className={ clsx( 'block-editor-word-break-control', className, {
				'is-next-has-no-margin-bottom': __nextHasNoMarginBottom,
			} ) }
			{ ...props }
		/>
	);
}
