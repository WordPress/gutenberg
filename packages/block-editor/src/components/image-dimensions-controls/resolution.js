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
		label: __( 'Thumbnail' ),
		value: 'thumbnail',
	},
	{
		label: __( 'Medium' ),
		value: 'medium',
	},
	{
		label: __( 'Large' ),
		value: 'large',
	},
	{
		label: __( 'Full Size' ),
		value: 'full',
	},
];

export default function ResolutionItem( {
	panelId,
	value,
	onChange,
	options = DEFAULT_SIZE_OPTIONS,
	defaultValue = DEFAULT_SIZE_OPTIONS[ 0 ].value,
} ) {
	return (
		<ToolsPanelItem
			hasValue={ () => value != null && value !== defaultValue }
			label={ __( 'Resolution' ) }
			onDeselect={ () => onChange( defaultValue ) }
			isShownByDefault={ true }
			panelId={ panelId }
		>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Resolution' ) }
				value={ value ?? defaultValue }
				options={ options }
				onChange={ onChange }
				help={ __( 'Select the size of the source image.' ) }
			/>
		</ToolsPanelItem>
	);
}
