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
 * @param {ImageSize} imageSize Image size object.
 * @return {void}
 */

/**
 * @callback OnChangeImage
 * @param {string} [newSlug] Image size slug.
 * @return {void}
 */

/**
 * @typedef {Object} ImageSizeControlProps
 * @property {string}             [imageSizeHelp]       Help text for the image size select control.
 * @property {number}             [width]               Specified width for the image.
 * @property {number}             [height]              Specified height for the image.
 * @property {number}             [naturalWidth]        Width of the image source.
 * @property {number}             [naturalHeight]       Height of the image source.
 * @property {ImageSizeOptions[]} [imageSizeOptions=[]] Array of image size options.
 * @property {boolean}            [isResizable=true]    Whether the image is resizable.
 * @property {string}             [slug]                Slug of the selected image size.
 * @property {OnChange}           [onChange]            Function to call when the styled image size changes.
 * @property {OnChangeImage}      [onChangeImage]       Function to call when the source image resolution changes.
 */

/**
 * Image size control.
 *
 * @param {ImageSizeControlProps} props Component props.
 *
 * @return {import('@wordpress/element').WPElement} Image size control.
 */
export default function ImageSizeControl( {
	imageSizeHelp,
	width,
	height,
	naturalWidth,
	naturalHeight,
	imageSizeOptions = [],
	isResizable = true,
	slug,
	onChange,
	onChangeImage,
} ) {
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
							placeholder={ __( 'Auto' ) }
							value={ width }
							min={ 1 }
							onChange={ ( nextWidth ) =>
								onChange( {
									width:
										nextWidth !== undefined
											? Number( nextWidth )
											: undefined,
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
								onChange( {
									width,
									height:
										nextHeight !== undefined
											? Number( nextHeight )
											: undefined,
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
											onChange( {
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
						<Button
							isSmall
							onClick={ () =>
								onChange( {
									width: undefined,
									height: undefined,
								} )
							}
						>
							{ __( 'Reset' ) }
						</Button>
					</HStack>
				</div>
			) }
		</>
	);
}
