/**
 * External dependencies
 */

import classnames from 'classnames';

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
import CroppedImage from './cropped-image';
import richImageRequest from './api';
import {
	RotateLeftIcon,
	RotateRightIcon,
	FlipHorizontalIcon,
	FlipVerticalIcon,
	CropIcon,
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
			crop: DEFAULT_CROP,
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
		const { crop } = this.state;

		this.adjustImage( 'crop', {
			cropX: crop.x,
			cropY: crop.y,
			cropWidth: crop.width,
			cropHeight: crop.height,
		} );
	}

	render() {
		const {
			isSelected,
			attributes,
			originalBlock: OriginalBlock,
			noticeUI,
		} = this.props;
		const { isCrop, inProgress, crop } = this.state;
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

					<CroppedImage
						url={ url }
						currentCrop={ isCrop ? crop : null }
						setCrop={ ( newCrop ) =>
							this.setState( { crop: newCrop } )
						}
						inProgress={ inProgress }
					>
						<OriginalBlock { ...this.props } />
					</CroppedImage>
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
