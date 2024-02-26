/**
 * WordPress dependencies
 */
import {
	SelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * @typedef {import('@wordpress/components/build-types/select-control/types').SelectControlProps} SelectControlProps
 */

/**
 * @type {SelectControlProps[]}
 */
export const DEFAULT_ASPECT_RATIO_OPTIONS = [
	{
		label: _x( 'Original', 'Aspect ratio option for dimensions control' ),
		value: 'auto',
	},
	{
		label: _x(
			'Square - 1:1',
			'Aspect ratio option for dimensions control'
		),
		value: '1',
	},
	{
		label: _x(
			'Standard - 4:3',
			'Aspect ratio option for dimensions control'
		),
		value: '4/3',
	},
	{
		label: _x(
			'Portrait - 3:4',
			'Aspect ratio option for dimensions control'
		),
		value: '3/4',
	},
	{
		label: _x(
			'Classic - 3:2',
			'Aspect ratio option for dimensions control'
		),
		value: '3/2',
	},
	{
		label: _x(
			'Classic Portrait - 2:3',
			'Aspect ratio option for dimensions control'
		),
		value: '2/3',
	},
	{
		label: _x(
			'Wide - 16:9',
			'Aspect ratio option for dimensions control'
		),
		value: '16/9',
	},
	{
		label: _x(
			'Tall - 9:16',
			'Aspect ratio option for dimensions control'
		),
		value: '9/16',
	},
	{
		label: _x( 'Custom', 'Aspect ratio option for dimensions control' ),
		value: 'custom',
		disabled: true,
		hidden: true,
	},
];

/**
 * @callback AspectRatioToolPropsOnChange
 * @param {string} [value] New aspect ratio value.
 * @return {void} No return.
 */

/**
 * @typedef {Object} AspectRatioToolProps
 * @property {string}                       [panelId]          ID of the panel this tool is associated with.
 * @property {string}                       [value]            Current aspect ratio value.
 * @property {AspectRatioToolPropsOnChange} [onChange]         Callback to update the aspect ratio value.
 * @property {SelectControlProps[]}         [options]          Aspect ratio options.
 * @property {string}                       [defaultValue]     Default aspect ratio value.
 * @property {boolean}                      [isShownByDefault] Whether the tool is shown by default.
 */

export default function AspectRatioTool( {
	panelId,
	value,
	onChange = () => {},
	options = DEFAULT_ASPECT_RATIO_OPTIONS,
	defaultValue = DEFAULT_ASPECT_RATIO_OPTIONS[ 0 ].value,
	hasValue,
	isShownByDefault = true,
} ) {
	// Match the CSS default so if the value is used directly in CSS it will look correct in the control.
	const displayValue = value ?? 'auto';

	return (
		<ToolsPanelItem
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
				value={ displayValue }
				options={ options }
				onChange={ onChange }
				size={ '__unstable-large' }
				__nextHasNoMarginBottom
			/>
		</ToolsPanelItem>
	);
}
