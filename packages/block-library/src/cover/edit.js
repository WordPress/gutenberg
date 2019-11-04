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
	Component,
	createRef,
	useCallback,
	useState,
} from '@wordpress/element';
import {
	FocalPointPicker,
	IconButton,
	PanelBody,
	PanelRow,
	RangeControl,
	ToggleControl,
	Toolbar,
	withNotices,
	ResizableBox,
	BaseControl,
	Button,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
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
	ColorPalette,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import icon from './icon';
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	COVER_MIN_HEIGHT,
	backgroundImageStyles,
	dimRatioToClass,
} from './shared';

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

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

const CoverHeightInput = withInstanceId(
	function( { value = '', instanceId, onChange } ) {
		const [ temporaryInput, setTemporaryInput ] = useState( null );
		const onChangeEvent = useCallback(
			( event ) => {
				const unprocessedValue = event.target.value;
				const inputValue = unprocessedValue !== '' ?
					parseInt( event.target.value, 10 ) :
					undefined;
				if ( ( isNaN( inputValue ) || inputValue < COVER_MIN_HEIGHT ) && inputValue !== undefined ) {
					setTemporaryInput( event.target.value );
					return;
				}
				setTemporaryInput( null );
				onChange( inputValue );
			},
			[ onChange, setTemporaryInput ]
		);
		const onBlurEvent = useCallback(
			() => {
				if ( temporaryInput !== null ) {
					setTemporaryInput( null );
				}
			},
			[ temporaryInput, setTemporaryInput ]
		);
		const inputId = `block-cover-height-input-${ instanceId }`;
		return (
			<BaseControl label={ __( 'Minimum height in pixels' ) } id={ inputId }>
				<input
					type="number"
					id={ inputId }
					onChange={ onChangeEvent }
					onBlur={ onBlurEvent }
					value={ temporaryInput !== null ? temporaryInput : value }
					min={ COVER_MIN_HEIGHT }
					step="10"
				/>
			</BaseControl>
		);
	}
);

const RESIZABLE_BOX_ENABLE_OPTION = {
	top: false,
	right: false,
	bottom: true,
	left: false,
	topRight: false,
	bottomRight: false,
	bottomLeft: false,
	topLeft: false,
};

function ResizableCover( {
	className,
	children,
	onResizeStart,
	onResize,
	onResizeStop,
} ) {
	const [ isResizing, setIsResizing ] = useState( false );
	const onResizeEvent = useCallback(
		( event, direction, elt ) => {
			onResize( elt.clientHeight );
			if ( ! isResizing ) {
				setIsResizing( true );
			}
		},
		[ onResize, setIsResizing ],
	);
	const onResizeStartEvent = useCallback(
		( event, direction, elt ) => {
			onResizeStart( elt.clientHeight );
			onResize( elt.clientHeight );
		},
		[ onResizeStart, onResize ]
	);
	const onResizeStopEvent = useCallback(
		( event, direction, elt ) => {
			onResizeStop( elt.clientHeight );
			setIsResizing( false );
		},
		[ onResizeStop, setIsResizing ]
	);

	return (
		<ResizableBox
			className={ classnames(
				className,
				{
					'is-resizing': isResizing,
				}
			) }
			enable={ RESIZABLE_BOX_ENABLE_OPTION }
			onResizeStart={ onResizeStartEvent }
			onResize={ onResizeEvent }
			onResizeStop={ onResizeStopEvent }
			minHeight={ COVER_MIN_HEIGHT }
		>
			{ children }
		</ResizableBox>
	);
}

class CoverEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isDark: false,
			temporaryMinHeight: null,
		};
		this.imageRef = createRef();
		this.videoRef = createRef();
		this.changeIsDarkIfRequired = this.changeIsDarkIfRequired.bind( this );
		this.onUploadError = this.onUploadError.bind( this );
	}

	componentDidMount() {
		this.handleBackgroundMode();
	}

	componentDidUpdate( prevProps ) {
		this.handleBackgroundMode( prevProps );
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	render() {
		const {
			attributes,
			setAttributes,
			isSelected,
			className,
			noticeUI,
			overlayColor,
			setOverlayColor,
			toggleSelection,
		} = this.props;
		const {
			backgroundType,
			dimRatio,
			focalPoint,
			hasParallax,
			id,
			url,
			minHeight,
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

		const { temporaryMinHeight } = this.state;

		const style = {
			...(
				backgroundType === IMAGE_BACKGROUND_TYPE ?
					backgroundImageStyles( url ) :
					{}
			),
			backgroundColor: overlayColor.color,
			minHeight: ( temporaryMinHeight || minHeight ),
		};

		if ( focalPoint ) {
			style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
		}

		const controls = (
			<>
				<BlockControls>
					{ !! ( url || overlayColor.color ) && (
						<>
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
						</>
					) }
				</BlockControls>
				<InspectorControls>
					{ !! url && (
						<PanelBody title={ __( 'Media Settings' ) }>
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
							<PanelRow>
								<Button
									isDefault
									isSmall
									className="block-library-cover__reset-button"
									onClick={ () => setAttributes( {
										url: undefined,
										id: undefined,
										backgroundType: undefined,
										dimRatio: undefined,
										focalPoint: undefined,
										hasParallax: undefined,
									} ) }
								>
									{ __( 'Clear Media' ) }
								</Button>
							</PanelRow>
						</PanelBody>
					) }
					{ ( url || overlayColor.color ) && (
						<>
							<PanelBody title={ __( 'Dimensions' ) }>
								<CoverHeightInput
									value={ temporaryMinHeight || minHeight }
									onChange={
										( value ) => {
											setAttributes( {
												minHeight: value,
											} );
										}
									}
								/>
							</PanelBody>
							<PanelColorSettings
								title={ __( 'Overlay' ) }
								initialOpen={ true }
								colorSettings={ [ {
									value: overlayColor.color,
									onChange: setOverlayColor,
									label: __( 'Overlay Color' ),
								} ] }
							>
								{ !! url && (
									<RangeControl
										label={ __( 'Background Opacity' ) }
										value={ dimRatio }
										onChange={ setDimRatio }
										min={ 0 }
										max={ 100 }
										step={ 10 }
										required
									/>
								) }
							</PanelColorSettings>
						</>
					) }
				</InspectorControls>
			</>
		);

		if ( ! ( url || overlayColor.color ) ) {
			const placeholderIcon = <BlockIcon icon={ icon } />;
			const label = __( 'Cover' );

			return (
				<>
					{ controls }
					<MediaPlaceholder
						icon={ placeholderIcon }
						className={ className }
						labels={ {
							title: label,
							instructions: __( 'Upload an image or video file, or pick one from your media library.' ),
						} }
						onSelect={ onSelectMedia }
						accept="image/*,video/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						notices={ noticeUI }
						onError={ this.onUploadError }
					>
						<ColorPalette
							disableCustomColors={ true }
							value={ overlayColor.color }
							onChange={ setOverlayColor }
							clearable={ false }
							className="wp-block-cover__placeholder-color-palette"
						/>
					</MediaPlaceholder>
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
				<ResizableCover
					className={ classnames(
						'block-library-cover__resize-container',
						{ 'is-selected': isSelected },
					) }
					onResizeStart={ () => toggleSelection( false ) }
					onResize={ ( newMinHeight ) => {
						this.setState( {
							temporaryMinHeight: newMinHeight,
						} );
					} }
					onResizeStop={
						( newMinHeight ) => {
							toggleSelection( true );
							setAttributes( {
								minHeight: newMinHeight,
							} );
							this.setState( {
								temporaryMinHeight: null,
							} );
						}
					}
				>

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
							/>
						</div>
					</div>
				</ResizableCover>
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
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( 'core/block-editor' );

		return {
			toggleSelection,
		};
	} ),
	withColors( { overlayColor: 'background-color' } ),
	withNotices,
	withInstanceId,
] )( CoverEdit );
