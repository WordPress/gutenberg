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
 * The descriptions are purposely made generic as object-fit could be used for
 * any replaced element. Provide your own set of options if you need different
 * help text or labels.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element
 *
 * @type {SelectControlProps[]}
 */
const DEFAULT_SCALE_OPTIONS = [
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for dimensions control' ),
		help: __( 'Fill the space by stretching the content.' ),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __( 'Fit the content to the space without clipping.' ),
	},
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for dimensions control' ),
		help: __( "Fill the space by clipping what doesn't fit." ),
	},
	{
		value: 'none',
		label: _x( 'None', 'Scale option for dimensions control' ),
		help: __(
			'Do not adjust the sizing of the content. Content that is too large will be clipped, and content that is too small will have additional padding.'
		),
	},
	{
		value: 'scale-down',
		label: _x( 'Scale down', 'Scale option for dimensions control' ),
		help: __(
			'Scale down the content to fit the space if it is too big. Content that is too small will have additional padding.'
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
 * @return {import('react').ReactElement} The scale tool.
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
				__nextHasNoMarginBottom
				label={ __( 'Scale' ) }
				isBlock
				help={ scaleHelp[ displayValue ] }
				value={ displayValue }
				onChange={ onChange }
				size="__unstable-large"
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
