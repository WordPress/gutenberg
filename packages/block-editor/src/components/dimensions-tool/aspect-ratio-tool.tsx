import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { __, _x } from '@wordpress/i18n';
import { useSettings } from '../use-settings';
import AspectRatioIcon from './aspect-ratio-icon';
import { findAspectRatioOption } from './utils';
import type {
	AspectRatioPreset,
	AspectRatioToolProps,
	DimensionsToolOption,
} from './types';

export default function AspectRatioTool( {
	panelId,
	value,
	onChange = () => {},
	options,
	defaultValue = 'auto',
	hasValue,
	isShownByDefault = true,
	className,
}: AspectRatioToolProps ) {
	const [ defaultRatios, themeRatios, showDefaultRatios ] = useSettings(
		'dimensions.aspectRatios.default',
		'dimensions.aspectRatios.theme',
		'dimensions.defaultAspectRatios'
	);

	// The settings list the aspect ratio presets.
	const themeOptions = (
		themeRatios as AspectRatioPreset[] | undefined
	 )?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );

	const defaultOptions = (
		defaultRatios as AspectRatioPreset[] | undefined
	 )?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );

	const aspectRatioOptions: DimensionsToolOption[] = [
		{
			label: _x(
				'Original',
				'Aspect ratio option for dimensions control'
			),
			value: 'auto',
		},
		// Default ratios are listed when the setting shows them.
		...( showDefaultRatios ? defaultOptions! : [] ),
		...( themeOptions ? themeOptions : [] ),
		{
			label: _x( 'Custom', 'Aspect ratio option for dimensions control' ),
			value: 'custom',
			disabled: true,
			hidden: true,
		},
	];

	const resolvedOptions = options ?? aspectRatioOptions;
	const visibleOptions = resolvedOptions.filter( ( item ) => ! item.hidden );

	// The value is free-form CSS, so it doesn't necessarily match an option as
	// written, e.g. '1/1' and '1' describe the same ratio. Resolve it to the
	// option that represents it, falling back to 'custom' so that a ratio
	// without a matching preset isn't displayed as one of the presets. Values
	// that are empty match the CSS default, so if the value is used directly in
	// CSS it will look correct in the control.
	const displayValue =
		value === undefined || value === null || value === 'auto'
			? 'auto'
			: ( findAspectRatioOption( value, resolvedOptions )?.value ??
				'custom' );

	return (
		<ToolsPanelItem
			className={ className }
			hasValue={
				hasValue ? hasValue : () => displayValue !== defaultValue
			}
			label={ __( 'Aspect ratio' ) }
			onDeselect={ () => onChange( undefined ) }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<SelectControl
				label={ __( 'Aspect ratio' ) }
				value={
					resolvedOptions.find(
						( item ) => item.value === displayValue
					) ??
					resolvedOptions.find( ( item ) => ! item.disabled ) ??
					null
				}
				items={ visibleOptions }
				onValueChange={ ( item ) => onChange( item?.value ?? '' ) }
				trigger={
					<SelectControl.Trigger>
						{ ( item ) => (
							<span className="block-editor-dimensions-tool__aspect-ratio-option">
								<AspectRatioIcon
									ratio={
										item.value === 'custom'
											? ( value ?? '' )
											: ( item.value ?? '' )
									}
								/>
								<span className="block-editor-dimensions-tool__aspect-ratio-label">
									{ item.label }
								</span>
							</span>
						) }
					</SelectControl.Trigger>
				}
			>
				{ visibleOptions.map( ( item ) => (
					<SelectControl.Item
						key={ item.value }
						value={ item }
						label={ item.label }
						disabled={ item.disabled }
					>
						<SelectControl.ItemLabel>
							<span className="block-editor-dimensions-tool__aspect-ratio-option">
								<AspectRatioIcon ratio={ item.value } />
								{ item.label }
							</span>
						</SelectControl.ItemLabel>
					</SelectControl.Item>
				) ) }
			</SelectControl>
		</ToolsPanelItem>
	);
}
