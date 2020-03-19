/**
 * External dependencies
 */

import classnames from 'classnames';
import Cropper from 'react-easy-crop';

/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { Fragment, Component } from '@wordpress/element';
import {
	Toolbar,
	IconButton,
	Icon,
	Button,
	Snackbar,
	withNotices,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import richImageRequest from './api';
import {
	RotateLeftIcon,
	RotateRightIcon,
	FlipHorizontalIcon,
	FlipVerticalIcon,
	CropIcon,
	AspectIcon,
} from './icon';

const ROTATE_STEP = 90;
const DEFAULT_CROP = {
	unit: '%',
	x: 25,
	y: 25,
	width: 50,
	height: 50,
};

class RichImage extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCrop: false,
			inProgress: null,
			imageSrc: null,
			imgSize: { naturalHeight: 0, naturalWidth: 0 },
			crop: null,
			position: { x: 0, y: 0 },
			zoom: 1,
			aspect: 4 / 3,
			isPortrait: false,
		};

		this.adjustImage = this.adjustImage.bind( this );
		this.cropImage = this.cropImage.bind( this );
		this.onCropChange = this.onCropChange.bind( this );
		this.onZoomChange = this.onZoomChange.bind( this );
		this.onCropComplete = this.onCropComplete.bind( this );
		this.onMediaLoaded = this.onMediaLoaded.bind( this );
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
		const { crop } = this.state;

		// Was getting occasional errors before rounding
		// TODO: Switch to pixel offset and dimensions to avoid that
		this.adjustImage( 'crop', {
			cropX: Math.round( crop.x ),
			cropY: Math.round( crop.y ),
			cropWidth: Math.round( crop.width ),
			cropHeight: Math.round( crop.height ),
		} );
	}

	onCropChange( position ) {
		this.setState( { position } );
	}

	onCropComplete( crop ) {
		this.setState( { crop } );
	}

	onZoomChange( zoom ) {
		this.setState( { zoom } );
	}

	onMediaLoaded( imgSize ) {
		this.setState( { imgSize } );
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
			imgSize,
			isPortrait,
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
			<Fragment>
				{ noticeUI }

				<div className={ classes }>
					{ inProgress && (
						<Snackbar className="richimage__working-notice">
							{ __( 'Processing…' ) }
						</Snackbar>
					) }

					{ isCrop ? (
						<div
							style={ {
								position: 'relative',
								maxWidth: '100%',
								width: imgSize.naturalWidth,
								paddingBottom: `${ ( 100 *
									imgSize.naturalHeight ) /
									imgSize.naturalWidth }%`,
							} }
						>
							<Cropper
								image={ url }
								disabled={ inProgress }
								crop={ position }
								zoom={ zoom }
								aspect={ isPortrait ? 1 / aspect : aspect }
								onZoomChange={ this.onZoomChange }
								onCropChange={ this.onCropChange }
								onCropComplete={ this.onCropComplete }
								onMediaLoaded={ this.onMediaLoaded }
							/>
						</div>
					) : (
						<OriginalBlock { ...this.props } />
					) }
				</div>

				{ isEditing && (
					<BlockControls>
						{ ! inProgress && (
							<Fragment>
								<Toolbar
									className="richimage-toolbar__dropdown"
									isCollapsed={ true }
									icon={ <RotateLeftIcon /> }
									label={ __( 'Rotate' ) }
									disabled={ inProgress }
									popoverProps={ {
										position: 'bottom right',
									} }
									controls={ [
										{
											icon: <RotateLeftIcon />,
											title: __( 'Rotate left' ),
											onClick: () =>
												this.adjustImage( 'rotate', {
													angle: -ROTATE_STEP,
												} ),
										},
										{
											icon: <RotateRightIcon />,
											title: __( 'Rotate right' ),
											onClick: () =>
												this.adjustImage( 'rotate', {
													angle: ROTATE_STEP,
												} ),
										},
									] }
								/>
								<Toolbar
									className="richimage-toolbar__dropdown"
									isCollapsed={ true }
									icon={ <FlipVerticalIcon /> }
									label={ __( 'Flip' ) }
									disabled={ inProgress }
									popoverProps={ {
										position: 'bottom right',
									} }
									controls={
										inProgress
											? []
											: [
													{
														icon: (
															<FlipVerticalIcon />
														),
														title: __(
															'Flip vertical'
														),
														onClick: () =>
															this.adjustImage(
																'flip',
																{
																	direction:
																		'vertical',
																}
															),
													},
													{
														icon: (
															<FlipHorizontalIcon />
														),
														title: __(
															'Flip horizontal'
														),
														onClick: () =>
															this.adjustImage(
																'flip',
																{
																	direction:
																		'horizontal',
																}
															),
													},
											  ]
									}
								/>
							</Fragment>
						) }

						<Toolbar>
							{ inProgress && (
								<Fragment>
									<IconButton
										disabled
										className="richimage-toolbar__working"
										icon={ <RotateLeftIcon /> }
										label={ __( 'Rotate' ) }
									/>
									<IconButton
										disabled
										className="richimage-toolbar__working"
										icon={ <FlipVerticalIcon /> }
										label={ __( 'Flip' ) }
									/>
								</Fragment>
							) }
							<IconButton
								className="components-toolbar__control richimage-toolbar__dropdown"
								disabled={ inProgress }
								icon={ <CropIcon /> }
								label={ __( 'Crop' ) }
								onClick={ () =>
									this.setState( {
										isCrop: ! isCrop,
										crop: DEFAULT_CROP,
									} )
								}
							/>
						</Toolbar>
					</BlockControls>
				) }

				{ isCrop && (
					<BlockControls>
						<Toolbar>
							<div className="richimage__crop-icon">
								<Icon icon={ CropIcon } />
							</div>
						</Toolbar>
						<Toolbar
							className="richimage-toolbar__dropdown"
							isCollapsed={ true }
							icon={ <AspectIcon /> }
							label={ __( 'Aspect Ratio' ) }
							disabled={ inProgress }
							popoverProps={ {
								position: 'bottom right',
							} }
							controls={
								inProgress
									? []
									: [
											{
												title: __( '16:10' ),
												onClick: () =>
													this.setState( {
														aspect: 16 / 10,
													} ),
											},
											{
												title: __( '16:9' ),
												onClick: () =>
													this.setState( {
														aspect: 16 / 9,
													} ),
											},
											{
												title: __( '4:3' ),
												onClick: () =>
													this.setState( {
														aspect: 4 / 3,
													} ),
											},
											{
												title: __( '3:2' ),
												onClick: () =>
													this.setState( {
														aspect: 3 / 2,
													} ),
											},
											{
												title: __( '1:1' ),
												onClick: () =>
													this.setState( {
														aspect: 1,
													} ),
											},
									  ]
							}
						/>
						<Toolbar>
							<IconButton
								className="richimage-toolbar__dropdown"
								disabled={ inProgress }
								icon="image-rotate-right"
								label={ __( 'Orientation' ) }
								onClick={ () =>
									this.setState( ( prev ) => ( {
										isPortrait: ! prev.isPortrait,
									} ) )
								}
							/>
						</Toolbar>
						<Toolbar>
							<Button onClick={ this.cropImage }>
								{ __( 'Apply' ) }
							</Button>
							<Button
								onClick={ () =>
									this.setState( { isCrop: false } )
								}
							>
								{ __( 'Cancel' ) }
							</Button>
						</Toolbar>
					</BlockControls>
				) }
			</Fragment>
		);
	}
}

export default compose( [ withNotices ] )( RichImage );
