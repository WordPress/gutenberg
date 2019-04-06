/**
 * External dependencies
 */
import classnames from 'classnames';
import FastAverageColor from 'fast-average-color';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import {
	FocalPointPicker,
	IconButton,
	PanelBody,
	RangeControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import {
	BlockControls,
	BlockIcon,
	InnerBlocks,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	PanelColorSettings,
	withColors,
} from '@wordpress/editor';
import { Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './icon';

/**
 * Module Constants
 */
export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const INNER_BLOCKS_TEMPLATE = [
	[ 'core/paragraph', {
		align: 'center',
		fontSize: 'large',
		placeholder: __( 'Write title…' ),
	} ],
];
const INNER_BLOCKS_ALLOWED_BLOCKS = [ 'core/button', 'core/heading', 'core/paragraph' ];

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

export function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}

class CoverEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isDark: false,
		};
		this.imageRef = createRef();
		this.videoRef = createRef();
		this.changeIsDarkIfRequired = this.changeIsDarkIfRequired.bind( this );
	}

	componentDidMount() {
		this.handleBackgroundMode();
	}

	componentDidUpdate( prevProps ) {
		this.handleBackgroundMode( prevProps );
	}

	render() {
		const {
			attributes,
			setAttributes,
			className,
			noticeOperations,
			noticeUI,
			overlayColor,
			setOverlayColor,
		} = this.props;
		const {
			backgroundType,
			dimRatio,
			focalPoint,
			hasParallax,
			id,
			url,
		} = attributes;
		const onSelectMedia = ( media ) => {
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

			setAttributes( {
				url: media.url,
				id: media.id,
				backgroundType: mediaType,
				...( mediaType === VIDEO_BACKGROUND_TYPE ?
					{ focalPoint: undefined, hasParallax: undefined } :
					{}
				),
			} );
		};

		const toggleParallax = () => {
			setAttributes( {
				hasParallax: ! hasParallax,
				...( ! hasParallax ? { focalPoint: undefined } : {} ),
			} );
		};
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

		const style = {
			...(
				backgroundType === IMAGE_BACKGROUND_TYPE ?
					backgroundImageStyles( url ) :
					{}
			),
			backgroundColor: overlayColor.color,
		};

		if ( focalPoint ) {
			style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
		}

		const controls = (
			<Fragment>
				<BlockControls>
					{ !! url && (
						<Fragment>
							<MediaUploadCheck>
								<Toolbar>
									<MediaUpload
										onSelect={ onSelectMedia }
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
							</MediaUploadCheck>
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
							{ IMAGE_BACKGROUND_TYPE === backgroundType && ! hasParallax && (
								<FocalPointPicker
									label={ __( 'Focal Point Picker' ) }
									url={ url }
									value={ focalPoint }
									onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
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
									required
								/>
							</PanelColorSettings>
						</PanelBody>
					</InspectorControls>
				) }
			</Fragment>
		);

		if ( ! url ) {
			const placeholderIcon = <BlockIcon icon={ icon } />;
			const label = __( 'Cover' );

			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ placeholderIcon }
						className={ className }
						labels={ {
							title: label,
							instructions: __( 'Drag an image or a video, upload a new one or select a file from your library.' ),
						} }
						onSelect={ onSelectMedia }
						accept="image/*,video/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
					/>
				</Fragment>
			);
		}

		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'is-dark-theme': this.state.isDark,
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		return (
			<Fragment>
				{ controls }
				<div
					data-url={ url }
					style={ style }
					className={ classes }
				>
					{ IMAGE_BACKGROUND_TYPE === backgroundType && (
						// Used only to programmatically check if the image is dark or not
						<img
							ref={ this.imageRef }
							aria-hidden
							alt=""
							style={ {
								display: 'none',
							} }
							src={ url }
						/>
					) }
					{ VIDEO_BACKGROUND_TYPE === backgroundType && (
						<video
							ref={ this.videoRef }
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

	handleBackgroundMode( prevProps ) {
		const { attributes, overlayColor } = this.props;
		const { dimRatio, url } = attributes;
		// If opacity is greater than 50 the dominant color is the overlay color,
		// so use that color for the dark mode computation.
		if ( dimRatio > 50 ) {
			if (
				prevProps &&
				prevProps.attributes.dimRatio > 50 &&
				prevProps.overlayColor.color === overlayColor.color
			) {
				// No relevant prop changes happened there is no need to apply any change.
				return;
			}
			if ( ! overlayColor.color ) {
				// If no overlay color exists the overlay color is black (isDark )
				this.changeIsDarkIfRequired( true );
				return;
			}
			this.changeIsDarkIfRequired(
				tinycolor( overlayColor.color ).isDark()
			);
			return;
		}
		// If opacity is lower than 50 the dominant color is the image or video color,
		// so use that color for the dark mode computation.

		if (
			prevProps &&
			prevProps.attributes.dimRatio <= 50 &&
			prevProps.attributes.url === url
		) {
			// No relevant prop changes happened there is no need to apply any change.
			return;
		}
		const { backgroundType } = attributes;

		let element;

		switch ( backgroundType ) {
			case IMAGE_BACKGROUND_TYPE:
				element = this.imageRef.current;
				break;
			case VIDEO_BACKGROUND_TYPE:
				element = this.videoRef.current;
				break;
		}
		if ( ! element ) {
			return;
		}
		retrieveFastAverageColor().getColorAsync( element, ( color ) => {
			this.changeIsDarkIfRequired( color.isDark );
		} );
	}

	changeIsDarkIfRequired( newIsDark ) {
		if ( this.state.isDark !== newIsDark ) {
			this.setState( {
				isDark: newIsDark,
			} );
		}
	}
}

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
	withNotices,
] )( CoverEdit );
