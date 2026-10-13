import clsx from 'clsx';
import { CustomSelectControl } from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
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
			value: null,
			label: __( 'Default' ),
		},
		...fontFamilies.map( ( { fontFamily, name } ) => ( {
			value: fontFamily,
			label: name || fontFamily,
			style: { fontFamily },
		} ) ),
	];

	const selectedValue =
		options.find( ( option ) => option.value === ( value || null ) ) ??
		options[ 0 ];

	// Callers can forward legacy props such as describedBy, size, and trigger focus callbacks.
	// SelectControl does not accept those props with the same behavior.
	if ( Object.keys( props ).length ) {
		const legacyOptions = options.map(
			( { value: key, label: name, style } ) => ( {
				key: key ?? '',
				name,
				style,
			} )
		);
		return (
			<CustomSelectControl
				label={ __( 'Font' ) }
				value={
					legacyOptions.find( ( option ) => option.key === value ) ??
					''
				}
				onChange={ ( { selectedItem } ) =>
					onChange( selectedItem.key )
				}
				options={ legacyOptions }
				className={ clsx(
					'block-editor-font-family-control',
					className
				) }
				{ ...props }
			/>
		);
	}

	return (
		<SelectControl
			label={ __( 'Font' ) }
			value={ selectedValue }
			onValueChange={ ( item ) => onChange( item?.value ?? '' ) }
			items={ options }
			className={ clsx( 'block-editor-font-family-control', className ) }
			{ ...props }
		>
			{ options.map( ( option ) => (
				<SelectControl.Item key={ option.value } value={ option }>
					<SelectControl.ItemLabel style={ option.style }>
						{ option.label }
					</SelectControl.ItemLabel>
				</SelectControl.Item>
			) ) }
		</SelectControl>
	);
}
