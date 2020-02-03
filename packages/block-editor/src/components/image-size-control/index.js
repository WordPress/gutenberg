/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	ButtonGroup,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { Component } from '@wordpress/element';

class ImageSizeControl extends Component {
	/**
	 * Run additional operations during component initialization.
	 *
	 * @param {Object} props
	 */
	constructor( props ) {
		super( props );

		this.updateDimensions = this.updateDimensions.bind( this );
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
			imageSizeOptions = [],
			isResizable = true,
			slug,
			width,
			height,
			onChange,
			onChangeImage = noop,
		} = this.props;

		return (
			<>
				{ ! isEmpty( imageSizeOptions ) && (
					<SelectControl
						label={ __( 'Image Size' ) }
						value={ slug }
						options={ imageSizeOptions }
						onChange={ onChangeImage }
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
								onChange={ ( value ) =>
									onChange( { width: parseInt( value, 10 ) } )
								}
							/>
							<TextControl
								type="number"
								className="block-editor-image-size-control__height"
								label={ __( 'Height' ) }
								value={ height || imageHeight || '' }
								min={ 1 }
								onChange={ ( value ) =>
									onChange( {
										height: parseInt( value, 10 ),
									} )
								}
							/>
						</div>
						<div className="block-editor-image-size-control__row">
							<ButtonGroup aria-label={ __( 'Image Size' ) }>
								{ [ 25, 50, 75, 100 ].map( ( scale ) => {
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
											isPrimary={ isCurrent }
											isPressed={ isCurrent }
											onClick={ this.updateDimensions(
												scaledWidth,
												scaledHeight
											) }
										>
											{ scale }%
										</Button>
									);
								} ) }
							</ButtonGroup>
							<Button isSmall onClick={ this.updateDimensions() }>
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
