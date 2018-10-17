/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	IconButton, PanelBody, RangeControl, ToggleControl, Toolbar, withNotices } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	BlockAlignmentToolbar,
	MediaPlaceholder,
	AlignmentToolbar,
	PanelColorSettings,
	RichText,
	withColors,
} from '@wordpress/editor';

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';
export const YOUTUBE_BACKGROUND_TYPE = 'youtube';

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

// Todo: memoize this calls when possible
export function getYoutubeIdFromUrl( url ) {
	const youtubeRegularExpression = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
	const match = url && url.match( youtubeRegularExpression );
	return match && match[ 1 ];
}

class CoverEdit extends Component {
	constructor() {
		super( ...arguments );
		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );

		// edit component has its own src in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			isEditing: ! this.props.url,
		};
	}

	onSelectURL( newUrl ) {
		const { attributes, setAttributes } = this.props;
		const { url } = attributes;

		// Set the block's src from the edit component's state, and switch off
		// the editing UI.
		if ( newUrl === url ) {
			this.setState( { isEditing: false } );
			return;
		}

		const youtubeId = getYoutubeIdFromUrl( newUrl );
		if ( youtubeId ) {
			setAttributes( {
				url: newUrl,
				id: undefined,
				backgroundType: YOUTUBE_BACKGROUND_TYPE,
			} );
			this.setState( { isEditing: false } );
			return;
		}

		const updateAttributesAndState = ( contentType ) => {
			if ( ! contentType ) {
				return;
			}
			if ( contentType.startsWith( IMAGE_BACKGROUND_TYPE ) ) {
				setAttributes( {
					url: newUrl,
					id: undefined,
					backgroundType: IMAGE_BACKGROUND_TYPE,
				} );
				this.setState( { isEditing: false } );
			}
			if ( contentType.startsWith( VIDEO_BACKGROUND_TYPE ) ) {
				setAttributes( {
					url: newUrl,
					id: undefined,
					backgroundType: VIDEO_BACKGROUND_TYPE,
				} );
				this.setState( { isEditing: false } );
			}
		};

		// Todo: Improve this code maybe remove XMLHttpRequest
		const { XMLHttpRequest } = window;
		const xHttp = new XMLHttpRequest();
		xHttp.open( 'HEAD', newUrl );
		xHttp.onreadystatechange = ( { target } ) => {
			if ( this.readyState === this.DONE ) {
				const contentType = target.getResponseHeader( 'Content-Type' );
				updateAttributesAndState( contentType );
				target.onreadystatechange = undefined;
			}
		};
		xHttp.send();
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
				// Videos contain the media type of 'file' in the object returned from the rest api.
				mediaType = VIDEO_BACKGROUND_TYPE;
			}
		} else { // for media selections originated from existing files in the media library.
			if (
				media.type !== IMAGE_BACKGROUND_TYPE &&
				media.type !== VIDEO_BACKGROUND_TYPE
			) {
				return;
			}
			mediaType = media.type;
		}
		if ( mediaType ) {
			setAttributes( {
				url: media.url,
				id: media.id,
				backgroundType: mediaType,
			} );
		} else {
			setAttributes( { url: media.url, id: media.id } );
		}
		this.setState( { isEditing: false } );
	}

	render() {
		const { attributes, setAttributes, isSelected, className, noticeOperations, noticeUI, overlayColor, setOverlayColor } = this.props;
		const { isEditing } = this.state;
		const {
			align,
			backgroundType,
			contentAlign,
			dimRatio,
			hasParallax,
			id,
			title,
			url,
		} = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );
		const setTitle = ( newTitle ) => setAttributes( { title: newTitle } );

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
			contentAlign !== 'center' && `has-${ contentAlign }-content`,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const controls = (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
					{ !! url && (
						<Fragment>
							<AlignmentToolbar
								value={ contentAlign }
								onChange={ ( nextAlign ) => {
									setAttributes( { contentAlign: nextAlign } );
								} }
							/>
							<Toolbar>
								<Toolbar>
									<IconButton
										className="components-icon-button components-toolbar__control"
										label={ __( 'Edit media' ) }
										onClick={ () => {
											this.setState( {
												isEditing: true,
											} );
										} }
										icon="edit"
									/>
								</Toolbar>
							</Toolbar>
						</Fragment>
					) }
				</BlockControls>
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

		if ( isEditing ) {
			const hasTitle = ! RichText.isEmpty( title );
			const icon = hasTitle ? undefined : 'format-image';
			const label = hasTitle ? (
				<RichText
					tagName="h2"
					value={ title }
					onChange={ setTitle }
					inlineToolbar
				/>
			) : __( 'Cover' );

			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ icon }
						className={ className }
						labels={ {
							title: label,
							/* translators: Fragment of the sentence: "Drag %s, upload a new one or select a file from your library." */
							name: __( 'an image or a video' ),
						} }
						onSelect={ this.onSelectMedia }
						accept="image/*,video/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
						onSelectURL={ this.onSelectURL }
						value={ {
							id,
							src: url,
						} }
					/>
				</Fragment>
			);
		}

		let youtubeIframeSrc;
		if ( YOUTUBE_BACKGROUND_TYPE === backgroundType ) {
			const youtubeId = getYoutubeIdFromUrl( url );
			youtubeIframeSrc = `https://www.youtube.com/embed/${ youtubeId }?rel=0&version=3&autoplay=1&mute=1&controls=0&controls=0&showinfo=0&loop=1&modestbranding=1&playlist=${ youtubeId }`;
		}

		return (
			<Fragment>
				{ controls }
				<div
					data-url={ url }
					style={ style }
					className={ classes }
				>
					{ VIDEO_BACKGROUND_TYPE === backgroundType && (
						<video
							className="wp-block-cover__video-background"
							autoPlay
							muted
							loop
							src={ url }
						/>
					) }
					{ YOUTUBE_BACKGROUND_TYPE === backgroundType && (
						<iframe
							className="wp-block-cover__video-background"
							title={ __( 'YouTube Video Background' ) }
							src={ youtubeIframeSrc }
							frameBorder="0"
							allow="autoplay; encrypted-media;"
							allowFullscreen
						/>
					) }
					{ ( ! RichText.isEmpty( title ) || isSelected ) && (
						<RichText
							tagName="p"
							className="wp-block-cover-text"
							placeholder={ __( 'Write title…' ) }
							value={ title }
							onChange={ setTitle }
							inlineToolbar
						/>
					) }
				</div>
			</Fragment>
		);
	}
}

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
	withNotices,
] )( CoverEdit );

