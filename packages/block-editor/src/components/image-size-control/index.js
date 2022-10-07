/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	SelectControl,
	TextControl,
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

	return (
		<>
			{ ! isEmpty( imageSizeOptions ) && (
				<SelectControl
					label={ __( 'Image size' ) }
					value={ slug }
					options={ imageSizeOptions }
					onChange={ onChangeImage }
					help={ imageSizeHelp }
				/>
			) }
			{ isResizable && (
				<div className="block-editor-image-size-control">
					<p className="block-editor-image-size-control__row">
						{ __( 'Image dimensions' ) }
					</p>
					<div className="block-editor-image-size-control__row">
						<TextControl
							type="number"
							className="block-editor-image-size-control__width"
							label={ __( 'Width' ) }
							value={ currentWidth }
							min={ 1 }
							onChange={ ( value ) =>
								updateDimension( 'width', value )
							}
						/>
						<TextControl
							type="number"
							className="block-editor-image-size-control__height"
							label={ __( 'Height' ) }
							value={ currentHeight }
							min={ 1 }
							onChange={ ( value ) =>
								updateDimension( 'height', value )
							}
						/>
					</div>
					<div className="block-editor-image-size-control__row">
						<ButtonGroup aria-label={ __( 'Image size presets' ) }>
							{ IMAGE_SIZE_PRESETS.map( ( scale ) => {
								const scaledWidth = Math.round(
									imageWidth * ( scale / 100 )
								);
								const scaledHeight = Math.round(
									imageHeight * ( scale / 100 )
								);

								const isCurrent =
									currentWidth === scaledWidth &&
									currentHeight === scaledHeight;

								return (
									<Button
										key={ scale }
										isSmall
										variant={
											isCurrent ? 'primary' : undefined
										}
										isPressed={ isCurrent }
										onClick={ () =>
											updateDimensions(
												scaledHeight,
												scaledWidth
											)
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
					</div>
				</div>
			) }
		</>
	);
}
