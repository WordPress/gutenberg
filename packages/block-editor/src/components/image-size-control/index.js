/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ButtonGroup, SelectControl, TextControl } from '@wordpress/components';
import { Component } from '@wordpress/element';

class ImageSizeControl extends Component {
	/**
	 * Run additional operations during component initialization.
	 *
	 * @param {Object} props
	 */
	constructor( props ) {
		super( props );

		this.updateImage = this.updateImage.bind( this );
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );
		this.updateDimensions = this.updateDimensions.bind( this );
	}

	updateImage( slug ) {
		this.props.onChangeImage( slug );
	}

	updateWidth( width ) {
		this.props.onChange( { width: parseInt( width, 10 ) } );
	}

	updateHeight( height ) {
		this.props.onChange( { height: parseInt( height, 10 ) } );
	}

	updateDimensions( width = undefined, height = undefined ) {
		return () => {
			this.props.onChange( { width, height } );
		};
	}

	render() {
		const {
			imageWidth,
			imageHeight,
			imageSizeOptions,
			isResizable = true,
			slug,
			width,
			height,
		} = this.props;

		return (
			<>
				{ ! isEmpty( imageSizeOptions ) && (
					<SelectControl
						label={ __( 'Image Size' ) }
						value={ slug }
						options={ imageSizeOptions }
						onChange={ this.updateImage }
					/>
				) }
				{ isResizable && (
					<div className="block-editor-image-size-control">
						<p className="block-editor-image-size-control__row">
							{ __( 'Image Dimensions' ) }
						</p>
						<div className="block-editor-image-size-control__row">
							<TextControl
								type="number"
								className="block-editor-image-size-control__width"
								label={ __( 'Width' ) }
								value={ width || imageWidth || '' }
								min={ 1 }
								onChange={ this.updateWidth }
							/>
							<TextControl
								type="number"
								className="block-editor-image-size-control__height"
								label={ __( 'Height' ) }
								value={ height || imageHeight || '' }
								min={ 1 }
								onChange={ this.updateHeight }
							/>
						</div>
						<div className="block-editor-image-size-control__row">
							<ButtonGroup aria-label={ __( 'Image Size' ) }>
								{ [ 25, 50, 75, 100 ].map( ( scale ) => {
									const scaledWidth = Math.round( imageWidth * ( scale / 100 ) );
									const scaledHeight = Math.round( imageHeight * ( scale / 100 ) );

									const isCurrent = width === scaledWidth && height === scaledHeight;

									return (
										<Button
											key={ scale }
											isSmall
											isPrimary={ isCurrent }
											aria-pressed={ isCurrent }
											onClick={ this.updateDimensions( scaledWidth, scaledHeight ) }
										>
											{ scale }%
										</Button>
									);
								} ) }
							</ButtonGroup>
							<Button
								isSmall
								onClick={ this.updateDimensions( imageWidth, imageHeight ) }
							>
								{ __( 'Reset' ) }
							</Button>
						</div>
					</div>
				) }
			</>
		);
	}
}

export default ImageSizeControl;
