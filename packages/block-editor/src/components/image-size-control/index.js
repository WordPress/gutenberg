/**
 * WordPress dependencies
 */
import {
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useDimensionHandler from './use-dimension-handler';

const IMAGE_SIZE_PRESETS = [ 25, 50, 75, 100 ];
const noop = () => {};

export default function ImageSizeControl( {
	imageSizeHelp,
	imageWidth,
	imageHeight,
	imageSizeOptions = [],
	isResizable = true,
	slug,
	width,
	height,
	onChange,
	onChangeImage = noop,
} ) {
	const { currentHeight, currentWidth, updateDimension, updateDimensions } =
		useDimensionHandler( height, width, imageHeight, imageWidth, onChange );

	/**
	 * Updates the dimensions for the given scale.
	 * Handler for toggle group control change.
	 *
	 * @param {number} scale The scale to update the dimensions for.
	 */
	const handleUpdateDimensions = ( scale ) => {
		/**
		 * Check if scale is deselected from toggle group control option.
		 */
		if ( undefined === scale ) {
			/**
			 * Update dimensions to default.
			 */
			updateDimensions();
			return;
		}

		/**
		 * Calculate scaled width and height.
		 */
		const scaledWidth = Math.round( imageWidth * ( scale / 100 ) );
		const scaledHeight = Math.round( imageHeight * ( scale / 100 ) );

		/**
		 * Update dimensions.
		 */
		updateDimensions( scaledHeight, scaledWidth );
	};

	/**
	 * Handler for adding the value to toggle group control.
	 */
	const addSelectedScaleValue = () => {
		/**
		 * Calculate scale size based on current width and image width.
		 */
		const scaleSize = Math.round( currentWidth * ( 100 / imageWidth ) );
		return scaleSize;
	};

	return (
		<>
			{ imageSizeOptions && imageSizeOptions.length > 0 && (
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Resolution' ) }
					value={ slug }
					options={ imageSizeOptions }
					onChange={ onChangeImage }
					help={ imageSizeHelp }
					size="__unstable-large"
				/>
			) }
			{ isResizable && (
				<div className="block-editor-image-size-control">
					<HStack align="baseline" spacing="3">
						<NumberControl
							className="block-editor-image-size-control__width"
							label={ __( 'Width' ) }
							value={ currentWidth }
							min={ 1 }
							onChange={ ( value ) =>
								updateDimension( 'width', value )
							}
							size="__unstable-large"
						/>
						<NumberControl
							className="block-editor-image-size-control__height"
							label={ __( 'Height' ) }
							value={ currentHeight }
							min={ 1 }
							onChange={ ( value ) =>
								updateDimension( 'height', value )
							}
							size="__unstable-large"
						/>
					</HStack>
					<ToggleGroupControl
						label={ __( 'Image size presets' ) }
						hideLabelFromVision
						onChange={ ( scale ) =>
							handleUpdateDimensions( scale )
						}
						value={ addSelectedScaleValue() }
						isBlock
						isDeselectable
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					>
						{ IMAGE_SIZE_PRESETS.map( ( scale ) => {
							return (
								<ToggleGroupControlOption
									key={ scale }
									value={ scale }
									label={ `${ scale }%` }
								/>
							);
						} ) }
					</ToggleGroupControl>
				</div>
			) }
		</>
	);
}
