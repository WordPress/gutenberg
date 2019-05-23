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
	Path,
	RangeControl,
	Rect,
	SVG,
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
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';
import { Component, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './icon';
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	backgroundImageStyles,
	dimRatioToClass,
} from './shared';
import { speak } from '@wordpress/a11y';

/**
 * Module Constants
 */
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

class CoverEdit extends Component {
	constructor( { attributes } ) {
		super( ...arguments );
		this.state = {
			isDark: false,
			isEditing: ! attributes.url,
		};
		this.imageRef = createRef();
		this.videoRef = createRef();
		this.changeIsDarkIfRequired = this.changeIsDarkIfRequired.bind( this );
		this.toggleIsEditing = this.toggleIsEditing.bind( this );
	}

	toggleIsEditing() {
		this.setState( {
			isEditing: ! this.state.isEditing,
		} );
		if ( this.state.isEditing ) {
			speak( __( 'You are now viewing the image in the image block.' ) );
		} else {
			speak( __( 'You are now editing the image in the image block.' ) );
		}
	}

	componentDidMount() {
		this.handleBackgroundMode();
	}

	componentDidUpdate( prevProps ) {
		this.handleBackgroundMode( prevProps );
	}

	render() {
		const { isEditing } = this.state;
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
			url,
		} = attributes;

		const onSelectUrl = ( newURL ) => {
			if ( newURL !== url ) {
				this.props.setAttributes( {
					url: newURL,
					id: undefined,
				} );
			}

			this.toggleIsEditing();
		};

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

			this.toggleIsEditing();
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
		const editImageIcon = ( <SVG width={ 20 } height={ 20 } viewBox="0 0 20 20"><Rect x={ 11 } y={ 3 } width={ 7 } height={ 5 } rx={ 1 } /><Rect x={ 2 } y={ 12 } width={ 7 } height={ 5 } rx={ 1 } /><Path d="M13,12h1a3,3,0,0,1-3,3v2a5,5,0,0,0,5-5h1L15,9Z" /><Path d="M4,8H3l2,3L7,8H6A3,3,0,0,1,9,5V3A5,5,0,0,0,4,8Z" /></SVG> );

		const controls = (
			<>
				<BlockControls>
					{ !! url && (
						<Toolbar>
							<IconButton
								className={ classnames( 'components-icon-button components-toolbar__control', { 'is-active': this.state.isEditing } ) }
								aria-pressed={ isEditing }
								label={ __( 'Edit media' ) }
								icon={ editImageIcon }
								onClick={ this.toggleIsEditing }
							/>
						</Toolbar>
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
			</>
		);

		if ( isEditing ) {
			const labels = {
				title: __( 'Cover' ),
				instructions: __( 'Drag an image or a video, upload a new one or select a file from your library.' ),
			};

			return (
				<>
					{ controls }
					<MediaPlaceholder
						icon={ <BlockIcon icon={ icon } /> }
						className={ className }
						labels={ labels }
						onSelect={ onSelectMedia }
						onSelectURL={ onSelectUrl }
						onDoubleClick={ this.toggleIsEditing }
						onCancel={ !! url && this.toggleIsEditing }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
						accept="image/*,video/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
					/>
				</>
			);
		}

		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'is-dark-theme': this.state.isDark,
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
				[ overlayColor.class ]: overlayColor.class,
			}
		);

		return (
			<>
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
			</>
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
