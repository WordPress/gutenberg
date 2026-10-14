import clsx from 'clsx';
import { Field, Select, VisuallyHidden } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
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
	label = __( 'Font' ),
	hideLabelFromVision,
	describedBy,
	size,
	disabled,
	options: customOptions,
	__experimentalShowSelectedHint = false,
	showSelectedHint = __experimentalShowSelectedHint,
	__nextUnconstrainedWidth: _nextUnconstrainedWidth,
	__nextHasNoMarginBottom: _nextHasNoMarginBottom,
	...props
} ) {
	const [ blockLevelFontFamilies ] = useSettings( 'typography.fontFamilies' );
	if ( ! fontFamilies ) {
		fontFamilies = blockLevelFontFamilies;
	}

	if ( ! fontFamilies || fontFamilies.length === 0 ) {
		return null;
	}

	const options = customOptions
		? customOptions.map( ( option ) => ( {
				value: option.key || null,
				label: option.name,
				style: option.style,
				className: option.className,
				description: option.hint ?? option.__experimentalHint,
			} ) )
		: [
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
	const selectedHint = showSelectedHint && selectedValue.description;

	return (
		<Field.Root
			className={ clsx( 'block-editor-font-family-control', className ) }
			disabled={ disabled }
		>
			<Field.Label
				className="block-editor-font-family-control__label"
				hideFromVision={ hideLabelFromVision }
			>
				{ label }
			</Field.Label>
			<Select.Root
				value={ selectedValue }
				onValueChange={ ( item ) => onChange( item?.value ?? '' ) }
				items={ options }
				disabled={ disabled }
			>
				<Select.Trigger size={ size } { ...props }>
					{ selectedHint ? (
						<>
							{ selectedValue.label }
							<span aria-hidden="true"> { selectedHint }</span>
						</>
					) : undefined }
				</Select.Trigger>
				<Select.Popup width="content">
					{ options.map( ( option ) => (
						<Select.Item
							key={ option.value }
							value={ option }
							className={ option.className }
						>
							<Select.ItemLabel style={ option.style }>
								{ option.label }
							</Select.ItemLabel>
							{ option.description && (
								<Select.ItemDescription>
									{ option.description }
								</Select.ItemDescription>
							) }
						</Select.Item>
					) ) }
				</Select.Popup>
			</Select.Root>
			<VisuallyHidden render={ <Field.Description /> }>
				{ describedBy ||
					sprintf(
						// translators: %s: The selected option.
						__( 'Currently selected: %s' ),
						selectedValue.label
					) }
				{ selectedHint && ` ${ selectedHint }` }
			</VisuallyHidden>
		</Field.Root>
	);
}
