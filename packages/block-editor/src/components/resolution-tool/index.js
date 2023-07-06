/**
 * WordPress dependencies
 */
import {
	SelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

const DEFAULT_SIZE_OPTIONS = [
	{
		label: _x( 'Thumbnail', 'Image size option for resolution control' ),
		value: 'thumbnail',
	},
	{
		label: _x( 'Medium', 'Image size option for resolution control' ),
		value: 'medium',
	},
	{
		label: _x( 'Large', 'Image size option for resolution control' ),
		value: 'large',
	},
	{
		label: _x( 'Full Size', 'Image size option for resolution control' ),
		value: 'full',
	},
];

export default function ResolutionTool( {
	panelId,
	value,
	onChange,
	options = DEFAULT_SIZE_OPTIONS,
	defaultValue = DEFAULT_SIZE_OPTIONS[ 0 ].value,
	isShownByDefault = true,
} ) {
	const displayValue = value ?? defaultValue;
	return (
		<ToolsPanelItem
			hasValue={ () => displayValue !== defaultValue }
			label={ __( 'Resolution' ) }
			onDeselect={ () => onChange( defaultValue ) }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<SelectControl
				label={ __( 'Resolution' ) }
				value={ displayValue }
				options={ options }
				onChange={ onChange }
				help={ __( 'Select the size of the source image.' ) }
				size={ '__unstable-large' }
			/>
		</ToolsPanelItem>
	);
}
