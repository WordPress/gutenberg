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
			'Content is scaled and cropped to fill the entire space without being distorted.'
		),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __(
			'Content is scaled to fill the space without clipping nor distorting.'
		),
	},
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for dimensions control' ),
		help: __(
			'Content will be stretched and distorted to completely fill the space.'
		),
	},
];

export default function ScaleTool( {
	panelId,
	value = 'fill', // Match the CSS default so if the value is used directly in CSS it will look correct in the control.
	onChange,
	options = DEFAULT_SCALE_OPTIONS,
	defaultValue = DEFAULT_SCALE_OPTIONS[ 0 ].value,
	showControl = true,
	isShownByDefault = true,
} ) {
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
			hasValue={ () => value != null && value !== defaultValue }
			onDeselect={ () => onChange( defaultValue ) }
			panelId={ panelId }
		>
			{ showControl && (
				<ToggleGroupControl
					label={ __( 'Scale' ) }
					isBlock
					help={ scaleHelp[ value ] }
					value={ value }
					onChange={ onChange }
				>
					{ options.map( ( option ) => (
						<ToggleGroupControlOption
							key={ option.value }
							{ ...option }
						/>
					) ) }
				</ToggleGroupControl>
			) }
		</ToolsPanelItem>
	);
}
