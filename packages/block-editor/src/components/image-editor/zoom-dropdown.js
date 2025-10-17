/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	RangeControl,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { MIN_ZOOM, MAX_ZOOM, POPOVER_PROPS } from './constants';

function roundToTwo( numValue ) {
	return Math.round( numValue * 100 ) / 100;
}

export default function ZoomDropdown() {
	const { cropperState, setCropperState } = useImageCropper();
	const { zoom } = cropperState;
	const value = ( roundToTwo( zoom * 100 ) || 0 ) + '%';
	const setZoom = ( newValue ) => {
		// Convert percentage value to a scale value. E.g. 150 becomes 1.5.
		setCropperState( {
			zoom: newValue !== undefined ? newValue / 100 : 1,
		} );
	};
	return (
		<Dropdown
			contentClassName="wp-block-image__zoom"
			popoverProps={ POPOVER_PROPS }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					icon={ search }
					label={ __( 'Zoom' ) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					//disabled={ isInProgress }
				/>
			) }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="medium">
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Zoom' ) }
						min={ MIN_ZOOM }
						max={ MAX_ZOOM }
						value={ value }
						onChange={ setZoom }
						step={ 1 }
						renderTooltipContent={ ( currentValue ) =>
							`${ currentValue }%`
						}
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}
