/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SIZES = { small: 170, medium: 290, large: 430 } as const;
type SizePreset = keyof typeof SIZES;

function presetForSize( size: number ): SizePreset {
	if ( size <= SIZES.small ) {
		return 'small';
	}
	if ( size >= SIZES.large ) {
		return 'large';
	}
	return 'medium';
}

export interface PreviewSizeControlProps {
	value: number;
	onChange: ( next: number ) => void;
}

/**
 * Toolbar segmented control for the picker tile size (DataViews `previewSize`),
 * across three presets.
 *
 * @param {PreviewSizeControlProps} props Component props.
 */
export function PreviewSizeControl( {
	value,
	onChange,
}: PreviewSizeControlProps ) {
	return (
		<ToggleGroupControl
			label={ __( 'Preview size' ) }
			hideLabelFromVision
			value={ presetForSize( value ) }
			onChange={ ( next ) => {
				if ( next ) {
					onChange( SIZES[ next as SizePreset ] );
				}
			} }
		>
			<ToggleGroupControlOption value="small" label={ __( 'Small' ) } />
			<ToggleGroupControlOption value="medium" label={ __( 'Medium' ) } />
			<ToggleGroupControlOption value="large" label={ __( 'Large' ) } />
		</ToggleGroupControl>
	);
}
