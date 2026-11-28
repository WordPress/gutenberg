import clsx from 'clsx';
import { Field, Select, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { CSSProperties } from 'react';
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';
import { useSettings } from '../use-settings';
import type { FontFamilyControlProps } from './types';

type FontFamilySelectOption = {
	value: string | null;
	label: string;
	style?: CSSProperties;
	className?: string;
	description?: string;
};

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
}: FontFamilyControlProps ) {
	const [ blockLevelFontFamilies ] = useSettings( 'typography.fontFamilies' );
	if ( ! fontFamilies ) {
		// The setting lists the font family presets.
		fontFamilies = blockLevelFontFamilies as FontFamilyPreset[] | undefined;
	}

	if ( ! fontFamilies || fontFamilies.length === 0 ) {
		return null;
	}

	const options: FontFamilySelectOption[] = customOptions
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
		options[ 0 ] ??
		null;
	const selectedHint = showSelectedHint && selectedValue?.description;
	const description = [ selectedHint, describedBy ]
		.filter( Boolean )
		.join( ' ' );

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
							<span
								className="block-editor-font-family-control__hint"
								aria-hidden="true"
							>
								{ ' ' }
								{ selectedHint }
							</span>
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
							{ !! option.description && (
								<Select.ItemDescription>
									{ option.description }
								</Select.ItemDescription>
							) }
						</Select.Item>
					) ) }
				</Select.Popup>
			</Select.Root>
			{ description && (
				<VisuallyHidden render={ <Field.Description /> }>
					{ description }
				</VisuallyHidden>
			) }
		</Field.Root>
	);
}
