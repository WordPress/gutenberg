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
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import {
	BaseControl,
	Button,
	FocalPointPicker,
	IconButton,
	PanelBody,
	PanelRow,
	RangeControl,
	ResizableBox,
	ToggleControl,
	ToolbarGroup,
	withNotices,
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
	withColors,
	ColorPalette,
	__experimentalUseGradient,
	__experimentalGradientPicker,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
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
		const inputId = `block-cover-height-input-${ instanceId }`;
		return (
			<BaseControl label={ __( 'Minimum height in pixels' ) } id={ inputId }>
				<input
					type="number"
					id={ inputId }
					onChange={ ( event ) => {
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
					} }
					onBlur={ () => {
						if ( temporaryInput !== null ) {
							setTemporaryInput( null );
						}
					} }
					value={ temporaryInput !== null ? temporaryInput : value }
					min={ COVER_MIN_HEIGHT }
					step="1"
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

	return (
		<ResizableBox
			className={ classnames(
				className,
				{
					'is-resizing': isResizing,
				}
			) }
			enable={ RESIZABLE_BOX_ENABLE_OPTION }
			onResizeStart={ ( event, direction, elt ) => {
				onResizeStart( elt.clientHeight );
				onResize( elt.clientHeight );
			} }
			onResize={ ( event, direction, elt ) => {
				onResize( elt.clientHeight );
				if ( ! isResizing ) {
					setIsResizing( true );
				}
			} }
			onResizeStop={ ( event, direction, elt ) => {
				onResizeStop( elt.clientHeight );
				setIsResizing( false );
			} }
			minHeight={ COVER_MIN_HEIGHT }
		>
			{ children }
		</ResizableBox>
	);
}

function onCoverSelectMedia( setAttributes ) {
	return ( media ) => {
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
}

/**
 * useCoverIsDark is a hook that returns a boolean variable specifying if the cover
 * background is dark or not.
 *
 * @param {?string} url          Url of the media background.
 * @param {?number} dimRatio     Transparency of the overlay color. If an image and
 *                               color are set, dimRatio is used to decide what is used
 *                               for background darkness checking purposes.
 * @param {?string} overlayColor String containing the overlay color value if one exists.
 * @param {?Object} elementRef   If a media background is set, elementRef should contain a reference to a
 *                               dom element that renders that media.
 *
 * @return {boolean} True if the cover background is considered "dark" and false otherwise.
 */
function useCoverIsDark( url, dimRatio = 50, overlayColor, elementRef ) {
	const [ isDark, setIsDark ] = useState( false );
	useEffect( () => {
		// If opacity is lower than 50 the dominant color is the image or video color,
		// so use that color for the dark mode computation.
		if ( url && dimRatio <= 50 && elementRef.current ) {
			retrieveFastAverageColor().getColorAsync( elementRef.current, ( color ) => {
				setIsDark( color.isDark );
			} );
		}
	}, [ url, url && dimRatio <= 50 && elementRef.current, setIsDark ] );
	useEffect( () => {
		// If opacity is greater than 50 the dominant color is the overlay color,
		// so use that color for the dark mode computation.
		if ( dimRatio > 50 || ! url ) {
			if ( ! overlayColor ) {
				// If no overlay color exists the overlay color is black (isDark )
				setIsDark( true );
				return;
			}
			setIsDark( tinycolor( overlayColor ).isDark() );
		}
	}, [ overlayColor, dimRatio > 50 || ! url, setIsDark ] );
	useEffect( () => {
		if ( ! url && ! overlayColor ) {
			// Reset isDark
			setIsDark( false );
		}
	}, [ ! url && ! overlayColor, setIsDark ] );
	return isDark;
}

function CoverEdit( {
	attributes,
	setAttributes,
	isSelected,
	className,
	noticeUI,
	overlayColor,
	setOverlayColor,
	toggleSelection,
	noticeOperations,
} ) {
	const {
		backgroundType,
		dimRatio,
		focalPoint,
		hasParallax,
		id,
		minHeight,
		url,
	} = attributes;
	const {
		gradientClass,
		gradientValue,
		setGradient,
	} = __experimentalUseGradient();
	const onSelectMedia = onCoverSelectMedia( setAttributes );

	const toggleParallax = () => {
		setAttributes( {
			hasParallax: ! hasParallax,
			...( ! hasParallax ? { focalPoint: undefined } : {} ),
		} );
	};

	const isDarkElement = useRef();
	const isDark = useCoverIsDark( url, dimRatio, overlayColor.color, isDarkElement );

	const [ temporaryMinHeight, setTemporaryMinHeight ] = useState( null );

	const { removeAllNotices, createErrorNotice } = noticeOperations;

	const style = {
		...(
			backgroundType === IMAGE_BACKGROUND_TYPE ?
				backgroundImageStyles( url ) :
				{}
		),
		backgroundColor: overlayColor.color,
		minHeight: ( temporaryMinHeight || minHeight ),
	};

	if ( gradientValue && ! url ) {
		style.background = gradientValue;
	}

	if ( focalPoint ) {
		style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
	}

	const hasBackground = !! ( url || overlayColor.color || gradientValue );

	const controls = (
		<>
			<BlockControls>
				{ hasBackground && (
					<>
						<MediaUploadCheck>
							<ToolbarGroup>
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
							</ToolbarGroup>
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
								onChange={ ( newFocalPoint ) => setAttributes( { focalPoint: newFocalPoint } ) }
							/>
						) }
						{ VIDEO_BACKGROUND_TYPE === backgroundType && (
							<video
								autoPlay
								muted
								loop
								src={ url }
							/>
						) }
						<PanelRow>
							<Button
								isSecondary
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
				{ hasBackground && (
					<>
						<PanelBody title={ __( 'Dimensions' ) }>
							<CoverHeightInput
								value={ temporaryMinHeight || minHeight }
								onChange={ ( newMinHeight ) => setAttributes( { minHeight: newMinHeight } ) }
							/>
						</PanelBody>
						<PanelColorGradientSettings
							title={ __( 'Overlay' ) }
							initialOpen={ true }
							settings={ [ {
								colorValue: overlayColor.color,
								gradientValue,
								onColorChange: setOverlayColor,
								onGradientChange: setGradient,
								label: __( 'Overlay' ),
							} ] }
						>
							{ !! url && (
								<RangeControl
									label={ __( 'Background Opacity' ) }
									value={ dimRatio }
									onChange={ ( newDimRation ) => setAttributes( { dimRatio: newDimRation } ) }
									min={ 0 }
									max={ 100 }
									step={ 10 }
									required
								/>
							) }
						</PanelColorGradientSettings>
					</>
				) }
			</InspectorControls>
		</>
	);

	if ( ! hasBackground ) {
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
					onError={ ( message ) => {
						removeAllNotices();
						createErrorNotice( message );
					} }
				>
					<div
						className="wp-block-cover__placeholder-background-options"
					>
						<ColorPalette
							disableCustomColors={ true }
							value={ overlayColor.color }
							onChange={ setOverlayColor }
							clearable={ false }
						/>
						<__experimentalGradientPicker
							disableCustomGradients
							onChange={
								( newGradient ) => {
									setGradient( newGradient );
									setAttributes( {
										overlayColor: undefined,
									} );
								}
							}
							value={ gradientValue }
							clearable={ false }
						/>
					</div>
				</MediaPlaceholder>
			</>
		);
	}

	const classes = classnames(
		className,
		dimRatioToClass( dimRatio ),
		{
			'is-dark-theme': isDark,
			'has-background-dim': dimRatio !== 0,
			'has-parallax': hasParallax,
			[ overlayColor.class ]: overlayColor.class,
			'has-background-gradient': gradientValue,
			[ gradientClass ]: ! url && gradientClass,
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
				onResize={ setTemporaryMinHeight }
				onResizeStop={
					( newMinHeight ) => {
						toggleSelection( true );
						setAttributes( { minHeight: newMinHeight } );
						setTemporaryMinHeight( null );
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
							ref={ isDarkElement }
							aria-hidden
							alt=""
							style={ {
								display: 'none',
							} }
							src={ url }
						/>
					) }
					{ url && gradientValue && dimRatio !== 0 && (
						<span
							aria-hidden="true"
							className={ classnames(
								'wp-block-cover__gradient-background',
								gradientClass,
							) }
							style={ { background: gradientValue } }
						/>
					) }
					{ VIDEO_BACKGROUND_TYPE === backgroundType && (
						<video
							ref={ isDarkElement }
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
