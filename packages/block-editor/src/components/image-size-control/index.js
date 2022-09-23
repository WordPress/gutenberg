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
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { unlock, lock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useDimensionHandler from './use-dimension-handler';
import { getImageRatio } from './utils';

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
	// Set currently-updating dimension to state.
	const [ dimension, setDimension ] = useState( 'height' );
	// Set whether or not we should be locking image aspect ratio. True by default.
	const [ lockAspectRatio, setToggleAspectRatio ] = useState( true );
	// Get and set height and width.
	const { currentHeight, currentWidth, updateDimension, updateDimensions } =
		useDimensionHandler(
			height,
			width,
			imageHeight,
			imageWidth,
			onChange,
			lockAspectRatio
		);

	/**
	 * Handle updating the aspect lock state on load.
	 */
	useEffect( () => {
		const ratio = getImageRatio( currentHeight, currentWidth );
		const defaultRatio = getImageRatio( imageHeight, imageWidth );

		// If our incoming ratio doesn't match the saved ratio.
		// Set assume unlock force-aspect ratio.
		if ( ratio !== defaultRatio ) {
			setToggleAspectRatio( false );
		}
	}, [] );

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
							onChange={ ( value ) => {
								setDimension( 'width' );
								updateDimension( 'width', value );
							} }
						/>
						<Button
							className="block-editor-image-size-control__proportions_toggle"
							icon={ lockAspectRatio ? lock : unlock }
							isSmall
							label={ sprintf(
								/* translators: image proportions */
								__( '%s Image Proportions' ),
								lockAspectRatio ? __( 'Unlock' ) : __( 'Lock' )
							) }
							onClick={ () => {
								const next = ! lockAspectRatio;
								setToggleAspectRatio( next );

								// If setting to true.
								// Update height/width with proper ratio.
								if ( next ) {
									updateDimension(
										dimension,
										'height' === dimension
											? currentHeight
											: currentWidth,
										true
									);
								}
							} }
							variant="tertiary"
						/>
						<TextControl
							type="number"
							className="block-editor-image-size-control__height"
							label={ __( 'Height' ) }
							value={ currentHeight }
							min={ 1 }
							onChange={ ( value ) => {
								setDimension( 'height' );
								updateDimension( 'height', value );
							} }
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
										onClick={ () => {
											updateDimensions(
												scaledHeight,
												scaledWidth
											);
											setToggleAspectRatio( true );
										} }
									>
										{ scale }%
									</Button>
								);
							} ) }
						</ButtonGroup>
						<Button
							isSmall
							onClick={ () => {
								updateDimensions();
								setToggleAspectRatio( true );
							} }
						>
							{ __( 'Reset' ) }
						</Button>
					</div>
				</div>
			) }
		</>
	);
}
