/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';

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

const IMAGE_SIZE_PRESETS = [ 25, 50, 75, 100 ];

export default function ImageSizeControl( {
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
	function updateDimensions( nextWidth, nextHeight ) {
		return () => {
			onChange( { width: nextWidth, height: nextHeight } );
		};
	}

	return (
		<>
			{ ! isEmpty( imageSizeOptions ) && (
				<SelectControl
					label={ __( 'Image size' ) }
					value={ slug }
					options={ imageSizeOptions }
					onChange={ onChangeImage }
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
							value={ width ?? imageWidth ?? '' }
							min={ 1 }
							onChange={ ( value ) =>
								onChange( { width: parseInt( value, 10 ) } )
							}
						/>
						<TextControl
							type="number"
							className="block-editor-image-size-control__height"
							label={ __( 'Height' ) }
							value={ height ?? imageHeight ?? '' }
							min={ 1 }
							onChange={ ( value ) =>
								onChange( {
									height: parseInt( value, 10 ),
								} )
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
										onClick={ updateDimensions(
											scaledWidth,
											scaledHeight
										) }
									>
										{ scale }%
									</Button>
								);
							} ) }
						</ButtonGroup>
						<Button isSmall onClick={ updateDimensions() }>
							{ __( 'Reset' ) }
						</Button>
					</div>
				</div>
			) }
		</>
	);
}
