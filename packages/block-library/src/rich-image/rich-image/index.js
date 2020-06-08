/**
 * External dependencies
 */

import classnames from 'classnames';
import Cropper from 'react-easy-crop';

/**
 * WordPress dependencies
 */

import {
	BlockControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import {
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
	crop,
	aspectRatio,
} from '@wordpress/icons';
import {
	ToolbarGroup,
	ToolbarButton,
	__experimentalToolbarItem as ToolbarItem,
	Icon,
	Spinner,
	withNotices,
	RangeControl,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import richImageRequest from './api';

const ROTATE_STEP = 90;
const DEFAULT_CROP = {
	unit: '%',
	x: 25,
	y: 25,
	width: 50,
	height: 50,
};
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const POPOVER_PROPS = { position: 'bottom right' };

function AspectGroup( { aspectRatios, isDisabled, label, onClick } ) {
	return (
		<MenuGroup label={ label }>
			{ aspectRatios.map( ( { title, aspect } ) => (
				<MenuItem
					key={ aspect }
					isDisabled={ isDisabled }
					onClick={ () => {
						onClick( aspect );
					} }
				>
					{ title }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

function AspectMenu( { isDisabled, onClick, toggleProps } ) {
	return (
		<DropdownMenu
			icon={ aspectRatio }
			label={ __( 'Aspect Ratio' ) }
			popoverProps={ POPOVER_PROPS }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<>
					<AspectGroup
						label={ __( 'Landscape' ) }
						isDisabled={ isDisabled }
						onClick={ ( aspect ) => {
							onClick( aspect );
							onClose();
						} }
						aspectRatios={ [
							{
								title: __( '16:10' ),
								aspect: 16 / 10,
							},
							{
								title: __( '16:9' ),
								aspect: 16 / 9,
							},
							{
								title: __( '4:3' ),
								aspect: 4 / 3,
							},
							{
								title: __( '3:2' ),
								aspect: 3 / 2,
							},
						] }
					/>
					<AspectGroup
						label={ __( 'Portrait' ) }
						isDisabled={ isDisabled }
						onClick={ ( aspect ) => {
							onClick( aspect );
							onClose();
						} }
						aspectRatios={ [
							{
								title: __( '10:16' ),
								aspect: 10 / 16,
							},
							{
								title: __( '9:16' ),
								aspect: 9 / 16,
							},
							{
								title: __( '3:4' ),
								aspect: 3 / 4,
							},
							{
								title: __( '2:3' ),
								aspect: 2 / 3,
							},
						] }
					/>
					<AspectGroup
						isDisabled={ isDisabled }
						onClick={ ( aspect ) => {
							onClick( aspect );
							onClose();
						} }
						aspectRatios={ [
							{
								title: __( 'Square' ),
								aspect: 1,
							},
						] }
					/>
				</>
			) }
		</DropdownMenu>
	);
}

class RichImage extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCrop: false,
			inProgress: null,
			imageSrc: null,
			imageSize: { naturalHeight: 0, naturalWidth: 0 },
			crop: null,
			position: { x: 0, y: 0 },
			zoom: 1,
			aspect: 4 / 3,
		};

		this.adjustImage = this.adjustImage.bind( this );
		this.cropImage = this.cropImage.bind( this );
	}

	adjustImage( action, attrs ) {
		const { setAttributes, attributes, noticeOperations } = this.props;
		const { id } = attributes;

		this.setState( { inProgress: action } );
		noticeOperations.removeAllNotices();

		richImageRequest( id, action, attrs )
			.then( ( response ) => {
				this.setState( { inProgress: null, isCrop: false } );

				if ( response.mediaID && response.mediaID !== id ) {
					setAttributes( {
						id: response.mediaID,
						url: response.url,
					} );
				}
			} )
			.catch( () => {
				noticeOperations.createErrorNotice(
					__(
						'Unable to perform the image modification. Please check your media storage.'
					)
				);
				this.setState( { inProgress: null, isCrop: false } );
			} );
	}

	cropImage() {
		this.adjustImage( 'crop', {
			cropX: this.state.crop.x,
			cropY: this.state.crop.y,
			cropWidth: this.state.crop.width,
			cropHeight: this.state.crop.height,
		} );
	}

	render() {
		const {
			isSelected,
			attributes,
			originalBlock: OriginalBlock,
			noticeUI,
		} = this.props;
		const {
			isCrop,
			inProgress,
			position,
			zoom,
			aspect,
			imageSize,
		} = this.state;
		const { url } = attributes;
		const isEditing = ! isCrop && isSelected && url;

		if ( ! isSelected ) {
			return <OriginalBlock { ...this.props } />;
		}

		const classes = classnames( {
			richimage__working: inProgress !== null,
			[ 'richimage__working__' + inProgress ]: inProgress !== null,
		} );

		return (
			<>
				{ noticeUI }

				<div className={ classes }>
					{ inProgress && (
						<div className="richimage__working-spinner">
							<Spinner />
						</div>
					) }

					{ isCrop ? (
						<Block.div className="richimage__crop-controls">
							<div
								className="richimage__crop-area"
								style={ {
									paddingBottom: `${
										( 100 * imageSize.naturalHeight ) /
										imageSize.naturalWidth
									}%`,
								} }
							>
								<Cropper
									image={ url }
									disabled={ inProgress }
									minZoom={ MIN_ZOOM }
									maxZoom={ MAX_ZOOM }
									crop={ position }
									zoom={ zoom }
									aspect={ aspect }
									onCropChange={ ( newPosition ) => {
										this.setState( {
											position: newPosition,
										} );
									} }
									onCropComplete={ ( newCrop ) => {
										this.setState( { crop: newCrop } );
									} }
									onZoomChange={ ( newZoom ) => {
										this.setState( { zoom: newZoom } );
									} }
									onMediaLoaded={ ( newImageSize ) => {
										this.setState( {
											imageSize: newImageSize,
										} );
									} }
								/>
							</div>
							<RangeControl
								className="richimage__zoom-control"
								label={ __( 'Zoom' ) }
								min={ MIN_ZOOM }
								max={ MAX_ZOOM }
								step={ ZOOM_STEP }
								value={ zoom }
								onChange={ ( newZoom ) => {
									this.setState( { zoom: newZoom } );
								} }
							/>
						</Block.div>
					) : (
						<OriginalBlock
							{ ...this.props }
							className={ classes }
						/>
					) }
				</div>

				{ isEditing && (
					<BlockControls>
						<ToolbarGroup>
							<ToolbarItem>
								{ ( toggleProps ) => (
									<DropdownMenu
										icon={ rotateLeft }
										label={ __( 'Rotate' ) }
										popoverProps={ POPOVER_PROPS }
										toggleProps={ toggleProps }
										controls={ [
											{
												icon: rotateLeft,
												title: __( 'Rotate left' ),
												isDisabled: inProgress,
												onClick: () =>
													this.adjustImage(
														'rotate',
														{
															angle: -ROTATE_STEP,
														}
													),
											},
											{
												icon: rotateRight,
												title: __( 'Rotate right' ),
												isDisabled: inProgress,
												onClick: () =>
													this.adjustImage(
														'rotate',
														{
															angle: ROTATE_STEP,
														}
													),
											},
										] }
									/>
								) }
							</ToolbarItem>
							<ToolbarItem>
								{ ( toggleProps ) => (
									<DropdownMenu
										icon={ flipVertical }
										label={ __( 'Flip' ) }
										popoverProps={ POPOVER_PROPS }
										toggleProps={ toggleProps }
										controls={ [
											{
												icon: flipVertical,
												title: __( 'Flip vertical' ),
												isDisabled: inProgress,
												onClick: () =>
													this.adjustImage( 'flip', {
														direction: 'vertical',
													} ),
											},
											{
												icon: flipHorizontal,
												title: __( 'Flip horizontal' ),
												isDisabled: inProgress,
												onClick: () =>
													this.adjustImage( 'flip', {
														direction: 'horizontal',
													} ),
											},
										] }
									/>
								) }
							</ToolbarItem>
							<ToolbarButton
								disabled={ inProgress }
								icon={ crop }
								label={ __( 'Crop' ) }
								onClick={ () =>
									this.setState( {
										isCrop: ! isCrop,
										crop: DEFAULT_CROP,
									} )
								}
							/>
						</ToolbarGroup>
					</BlockControls>
				) }

				{ isCrop && (
					<BlockControls>
						<ToolbarGroup>
							<div className="richimage__crop-icon">
								<Icon icon={ crop } />
							</div>
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarItem>
								{ ( toggleProps ) => (
									<AspectMenu
										toggleProps={ toggleProps }
										isDisabled={ inProgress }
										onClick={ ( newAspect ) => {
											this.setState( {
												aspect: newAspect,
											} );
										} }
									/>
								) }
							</ToolbarItem>
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarButton onClick={ this.cropImage }>
								{ __( 'Apply' ) }
							</ToolbarButton>
							<ToolbarButton
								onClick={ () =>
									this.setState( { isCrop: false } )
								}
							>
								{ __( 'Cancel' ) }
							</ToolbarButton>
						</ToolbarGroup>
					</BlockControls>
				) }
			</>
		);
	}
}

export default compose( [ withNotices ] )( RichImage );
