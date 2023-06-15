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

const DEFAULT_SCALE_OPTIONS = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for Image dimension control' ),
		help: __(
			'Image is scaled and cropped to fill the entire space without being distorted.'
		),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for Image dimension control' ),
		help: __(
			'Image is scaled to fill the space without clipping nor distorting.'
		),
	},
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for Image dimension control' ),
		help: __(
			'Image will be stretched and distorted to completely fill the space.'
		),
	},
];

export default function ScaleItem( {
	panelId,
	value,
	onChange,
	options = DEFAULT_SCALE_OPTIONS,
	defaultValue = DEFAULT_SCALE_OPTIONS[ 0 ].value,
} ) {
	const label = _x( 'Scale', 'Image scaling options' );
	const scaleHelp = useMemo( () => {
		return options.reduce( ( acc, option ) => {
			acc[ option.value ] = option.help;
			return acc;
		}, {} );
	}, [ options ] );
	return (
		<ToolsPanelItem
			hasValue={ () => value != null && value !== defaultValue }
			label={ label }
			onDeselect={ () => onChange( defaultValue ) }
			isShownByDefault={ true }
			panelId={ panelId }
		>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				label={ label }
				value={ value ?? defaultValue }
				help={ scaleHelp[ value ] }
				onChange={ onChange }
				isBlock
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
