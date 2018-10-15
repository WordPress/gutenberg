/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	IconButton,
	PanelBody,
	RangeControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	InnerBlocks,
	MediaPlaceholder,
	MediaUpload,
	PanelColorSettings,
	withColors,
} from '@wordpress/editor';

const INNER_BLOCKS_TEMPLATE = [
	[ 'core/paragraph', {
		align: 'center',
		fontSize: 'large',
		placeholder: __( 'Write title…' ),
	} ],
];
const INNER_BLOCKS_ALLOWED_BLOCKS = [
	'core/button',
	'core/heading',
	'core/paragraph',
];
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';

class CoverEdit extends Component {
	constructor() {
		super( ...arguments );
		this.onSelectMedia = this.onSelectMedia.bind( this );
	}

	onSelectMedia( media ) {
		const { setAttributes } = this.props;
		if ( ! media || ! media.url ) {
			setAttributes( { url: undefined, id: undefined } );
			return;
		}
		let mediaType;
		// for media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === IMAGE_BACKGROUND_TYPE ) {
				mediaType = IMAGE_BACKGROUND_TYPE;
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// video contain the media type of 'file' in the object returned from the rest api.
				mediaType = VIDEO_BACKGROUND_TYPE;
			}
		} else { // for media selections originated from existing files in the media library.
			mediaType = media.type;
		}
		if ( mediaType ) {
			setAttributes( {
				url: media.url,
				id: media.id,
				backgroundType: mediaType,
			} );
			return;
		}
		setAttributes( { url: media.url, id: media.id } );
	}

	render() {
		const {
			attributes,
			className,
			noticeOperations,
			noticeUI,
			overlayColor,
			setAttributes,
			setOverlayColor,
		} = this.props;

		const {
			backgroundType,
			dimRatio,
			hasParallax,
			id,
			url,
		} = attributes;

		const toggleParallax = () => setAttributes( {
			hasParallax: ! hasParallax,
		} );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

		const style = {
			...(
				backgroundType === IMAGE_BACKGROUND_TYPE ?
					backgroundImageStyles( url ) :
					{}
			),
			backgroundColor: overlayColor.color,
		};

		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const controls = (
			<Fragment>
				{ !! url && (
					<BlockControls>
						<Toolbar>
							<MediaUpload
								onSelect={ this.onSelectMedia }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								value={ id }
								render={ ( { open } ) => (
									<IconButton
										className="components-toolbar__control"
										label={ __( 'Edit media' ) }
										icon="edit"
										onClick={ open }
									/>
								) }
							/>
						</Toolbar>
					</BlockControls>
				) }
				{ !! url && (
					<InspectorControls>
						<PanelBody title={ __( 'Cover Settings' ) }>
							{ IMAGE_BACKGROUND_TYPE === backgroundType && (
								<ToggleControl
									label={ __( 'Fixed Background' ) }
									checked={ hasParallax }
									onChange={ toggleParallax }
								/>
							) }
							<PanelColorSettings
								title={ __( 'Overlay' ) }
								initialOpen={ true }
								colorSettings={ [ {
									value: overlayColor.color,
									onChange: setOverlayColor,
									label: __( 'Overlay Color' ),
								} ] }
							>
								<RangeControl
									label={ __( 'Background Opacity' ) }
									value={ dimRatio }
									onChange={ setDimRatio }
									min={ 0 }
									max={ 100 }
									step={ 10 }
								/>
							</PanelColorSettings>
						</PanelBody>
					</InspectorControls>
				) }
			</Fragment>
		);

		if ( ! url ) {
			const icon = 'format-image';
			const label = ( 'Cover' );

			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ icon }
						className={ className }
						labels={ {
							title: label,
							name: __( 'an image or a video' ),
						} }
						onSelect={ this.onSelectMedia }
						accept="image/*,video/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
					/>
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ controls }
				<div
					data-url={ url }
					style={ style }
					className={ classes }
				>
					{ VIDEO_BACKGROUND_TYPE === backgroundType && url && (
						<video
							className="wp-block-cover__video-background"
							autoPlay
							muted
							loop
							src={ url }
						/>
					) }
					<div className="wp-block-cover__inner-container">
						<InnerBlocks
							template={ INNER_BLOCKS_TEMPLATE }
							allowedBlocks={ INNER_BLOCKS_ALLOWED_BLOCKS }
						/>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
	withNotices,
] )( CoverEdit );

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}

export function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}
