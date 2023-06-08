/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const IMAGE_SIZE_PRESETS = [ 25, 50, 75, 100 ];

const SCALE_OPTIONS = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for Image dimension control' ),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for Image dimension control' ),
	},
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for Image dimension control' ),
	},
];

/**
 * @typedef {Object} ImageSizeOptions
 * @property {string} value Image size slug.
 * @property {string} label Image size label.
 */

/**
 * @typedef {Object} ImageSize
 * @property {number} [width]  Image width.
 * @property {number} [height] Image height.
 */

/**
 * @callback OnChange
 * @param {ImageSize} newImageSize Image size object.
 * @return {void}
 */

/**
 * @callback OnChangeImage
 * @param {string} [newSlug] Image size slug.
 * @return {void}
 */

/**
 * Image size control.
 *
 * @param {Object}             props                       Component props.
 * @param {string}             [props.imageSizeHelp]       Help text for the image size select control.
 * @param {number}             [props.width]               Specified width for the image.
 * @param {number}             [props.height]              Specified height for the image.
 * @param {number}             [props.naturalWidth]        Width of the image source.
 * @param {number}             [props.naturalHeight]       Height of the image source.
 * @param {ImageSizeOptions[]} [props.imageSizeOptions=[]] Array of image size options.
 * @param {boolean}            [props.isResizable=true]    Whether the image is resizable.
 * @param {string}             [props.slug]                Slug of the selected image size.
 * @param {OnChange}           [props.onChange]            Function to call when the styled image size changes.
 * @param {OnChangeImage}      [props.onChangeImage]       Function to call when the source image resolution changes.
 *
 * @return {import('@wordpress/element').WPElement} Image size control.
 */
export function ImageSizeControl( {
	imageSizeHelp,
	width,
	height,
	naturalWidth,
	naturalHeight,
	aspectRatioOptions = [],
	imageSizeOptions = [],
	isResizable = true,
	slug,
	onChange,
	onChangeImage,
} ) {
	const updateDimensions = ( dimensions = {} ) => {
		const newWidth = Number( dimensions.width );
		const newHeight = Number( dimensions.height );
		onChange( {
			width: Number.isNaN( newWidth ) ? undefined : newWidth,
			height: Number.isNaN( newHeight ) ? undefined : newHeight,
		} );
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
			{ aspectRatioOptions && aspectRatioOptions.length > 0 && (
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Aspect ratio' ) }
					value={ aspectRatio }
					options={ [
						// These should use the same values as AspectRatioDropdown in @wordpress/block-editor
						{
							label: __( 'Original' ),
							value: 'auto',
						},
						{
							label: __( 'Square' ),
							value: '1',
						},
						{
							label: __( '16:9' ),
							value: '16/9',
						},
						{
							label: __( '4:3' ),
							value: '4/3',
						},
						{
							label: __( '3:2' ),
							value: '3/2',
						},
						{
							label: __( '9:16' ),
							value: '9/16',
						},
						{
							label: __( '3:4' ),
							value: '3/4',
						},
						{
							label: __( '2:3' ),
							value: '2/3',
						},
					] }
					onChange={ ( nextAspectRatio ) =>
						setAttributes( { aspectRatio: nextAspectRatio } )
					}
				/>
			) }
			{ isResizable && (
				<div className="block-editor-image-size-control">
					<HStack align="baseline" spacing="3">
						<NumberControl
							className="block-editor-image-size-control__width"
							label={ __( 'Width' ) }
							placeholder={ __( 'Auto' ) }
							value={ width }
							min={ 1 }
							onChange={ ( nextWidth ) =>
								updateDimensions( {
									width: nextWidth,
									height,
								} )
							}
							size="__unstable-large"
						/>
						<NumberControl
							className="block-editor-image-size-control__height"
							label={ __( 'Height' ) }
							placeholder={ __( 'Auto' ) }
							value={ height }
							min={ 1 }
							onChange={ ( nextHeight ) =>
								updateDimensions( {
									width,
									height: nextHeight,
								} )
							}
							size="__unstable-large"
						/>
					</HStack>
					<HStack>
						<ButtonGroup aria-label={ __( 'Image size presets' ) }>
							{ IMAGE_SIZE_PRESETS.map( ( scale ) => {
								const scaledWidth = Math.round(
									naturalWidth * ( scale / 100 )
								);
								const scaledHeight = Math.round(
									naturalHeight * ( scale / 100 )
								);

								const isCurrent =
									width === scaledWidth &&
									height === scaledHeight;

								return (
									<Button
										key={ scale }
										isSmall
										variant={
											isCurrent ? 'primary' : undefined
										}
										isPressed={ isCurrent }
										onClick={ () =>
											updateDimensions( {
												width: scaledWidth,
												height: scaledHeight,
											} )
										}
									>
										{ scale }%
									</Button>
								);
							} ) }
						</ButtonGroup>
						<Button isSmall onClick={ () => updateDimensions() }>
							{ __( 'Reset' ) }
						</Button>
					</HStack>
				</div>
			) }
		</>
	);
}

// Maintain backwards compatibility for the __experimentalImageSizeControl export.
export default function ExperimentalImageSizeControl( {
	imageSizeHelp,
	width,
	height,
	imageWidth,
	imageHeight,
	imageSizeOptions,
	isResizable,
	slug,
	onChange,
	onChangeImage,
} ) {
	return (
		<PrivateImageSizeControl
			imageSizeHelp={ imageSizeHelp }
			width={ width }
			height={ height }
			naturalWidth={ imageWidth }
			naturalHeight={ imageHeight }
			imageSizeOptions={ imageSizeOptions }
			isResizable={ isResizable }
			slug={ slug }
			onChange={ onChange }
			onChangeImage={ onChangeImage }
		/>
	);
}
