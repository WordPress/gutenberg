/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * @typedef {import('@wordpress/components/build-types/select-control/types').SelectControlProps} SelectControlProps
 */

/**
 * @type {SelectControlProps[]}
 */
const DEFAULT_SCALE_OPTIONS = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for dimensions control' ),
		help: __(
			'Scale and crop to fill the space without being distorted.'
		),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __(
			'Scale to fill the space without clipping or distorting.'
		),
	},
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for dimensions control' ),
		help: __(
			'Stretch and distort to fill the space.'
		),
	},
];

/**
 * @callback ScaleToolPropsOnChange
 * @param {string} nextValue New scale value.
 * @return {void}
 */

/**
 * @typedef {Object} ScaleToolProps
 * @property {string}                 [panelId]               ID of the panel that contains the controls.
 * @property {string}                 [value]                 Current scale value.
 * @property {ScaleToolPropsOnChange} [onChange]              Callback to update the scale value.
 * @property {SelectControlProps[]}   [options]               Scale options.
 * @property {string}                 [defaultValue]          Default scale value.
 * @property {boolean}                [showControl=true]      Whether to show the control.
 * @property {boolean}                [isShownByDefault=true] Whether the tool panel is shown by default.
 */

/**
 * A tool to select the CSS object-fit property for the image.
 *
 * @param {ScaleToolProps} props
 *
 * @return {import('@wordpress/element').WPElement} The scale tool.
 */
export default function ScaleTool( {
	panelId,
	value,
	onChange,
	options = DEFAULT_SCALE_OPTIONS,
	defaultValue = DEFAULT_SCALE_OPTIONS[ 0 ].value,
	isShownByDefault = true,
} ) {
	// Match the CSS default so if the value is used directly in CSS it will look correct in the control.
	const displayValue = value ?? 'fill';

	// TODO: Since we're passing in options, would it make sense to hardcode the help text as a lookup for all CSS values inste?
	const scaleHelp = useMemo( () => {
		return options.reduce( ( acc, option ) => {
			acc[ option.value ] = option.help;
			return acc;
		}, {} );
	}, [ options ] );

	return (
		<ToolsPanelItem
			label={ __( 'Scale' ) }
			isShownByDefault={ isShownByDefault }
			hasValue={ () => displayValue !== defaultValue }
			onDeselect={ () => onChange( defaultValue ) }
			panelId={ panelId }
		>
			<ToggleGroupControl
				label={ __( 'Scale' ) }
				isBlock
				help={ scaleHelp[ displayValue ] }
				value={ displayValue }
				onChange={ onChange }
				__nextHasNoMarginBottom
			>
				{ options.map( ( option ) => (
					<ToggleGroupControlOption
						key={ option.value }
						{ ...option }
					/>
				) ) }
			</ToggleGroupControl>
		</ToolsPanelItem>
	);
}
