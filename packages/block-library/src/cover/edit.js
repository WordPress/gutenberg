/**
 * External dependencies
 */
import classnames from 'classnames';
import FastAverageColor from 'fast-average-color';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import {
	BaseControl,
	Button,
	FocalPointPicker,
	PanelBody,
	PanelRow,
	RangeControl,
	ResizableBox,
	Spinner,
	ToggleControl,
	withNotices,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';
import { compose, withInstanceId, useInstanceId } from '@wordpress/compose';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	withColors,
	ColorPalette,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalUseGradient,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalUnitControl as UnitControl,
	__experimentalBlockAlignmentMatrixToolbar as BlockAlignmentMatrixToolbar,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { cover as icon } from '@wordpress/icons';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import {
	attributesFromMedia,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	COVER_MIN_HEIGHT,
	CSS_UNITS,
	backgroundImageStyles,
	dimRatioToClass,
	isContentPositionCenter,
	getPositionClassName,
} from './shared';

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const INNER_BLOCKS_TEMPLATE = [
	[
		'core/paragraph',
		{
			align: 'center',
			fontSize: 'large',
			placeholder: __( 'Write title…' ),
		},
	],
];

const { __Visualizer: BoxControlVisualizer } = BoxControl;

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

function CoverHeightInput( {
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
} ) {
	const [ temporaryInput, setTemporaryInput ] = useState( null );
	const instanceId = useInstanceId( UnitControl );
	const inputId = `block-cover-height-input-${ instanceId }`;
	const isPx = unit === 'px';

	const handleOnChange = ( unprocessedValue ) => {
		const inputValue =
			unprocessedValue !== ''
				? parseInt( unprocessedValue, 10 )
				: undefined;

		if ( isNaN( inputValue ) && inputValue !== undefined ) {
			setTemporaryInput( unprocessedValue );
			return;
		}
		setTemporaryInput( null );
		onChange( inputValue );
		if ( inputValue === undefined ) {
			onUnitChange();
		}
	};

	const handleOnBlur = () => {
		if ( temporaryInput !== null ) {
			setTemporaryInput( null );
		}
	};

	const inputValue = temporaryInput !== null ? temporaryInput : value;
	const min = isPx ? COVER_MIN_HEIGHT : 0;

	return (
		<BaseControl label={ __( 'Minimum height of cover' ) } id={ inputId }>
			<UnitControl
				id={ inputId }
				isResetValueOnUnitChange
				min={ min }
				onBlur={ handleOnBlur }
				onChange={ handleOnChange }
				onUnitChange={ onUnitChange }
				step="1"
				style={ { maxWidth: 80 } }
				unit={ unit }
				units={ CSS_UNITS }
				value={ inputValue }
			/>
		</BaseControl>
	);
}

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
	onResizeStart,
	onResize,
	onResizeStop,
	...props
} ) {
	const [ isResizing, setIsResizing ] = useState( false );

	return (
		<ResizableBox
			className={ classnames( className, {
				'is-resizing': isResizing,
			} ) }
			enable={ RESIZABLE_BOX_ENABLE_OPTION }
			onResizeStart={ ( _event, _direction, elt ) => {
				onResizeStart( elt.clientHeight );
				onResize( elt.clientHeight );
			} }
			onResize={ ( _event, _direction, elt ) => {
				onResize( elt.clientHeight );
				if ( ! isResizing ) {
					setIsResizing( true );
				}
			} }
			onResizeStop={ ( _event, _direction, elt ) => {
				onResizeStop( elt.clientHeight );
				setIsResizing( false );
			} }
			minHeight={ COVER_MIN_HEIGHT }
			{ ...props }
		/>
	);
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
			retrieveFastAverageColor().getColorAsync(
				elementRef.current,
				( color ) => {
					setIsDark( color.isDark );
				}
			);
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
	noticeUI,
	overlayColor,
	setOverlayColor,
	toggleSelection,
	noticeOperations,
} ) {
	const {
		contentPosition,
		id,
		backgroundType,
		dimRatio,
		focalPoint,
		hasParallax,
		isRepeated,
		minHeight,
		minHeightUnit,
		style: styleAttribute,
		url,
	} = attributes;
	const {
		gradientClass,
		gradientValue,
		setGradient,
	} = __experimentalUseGradient();
	const onSelectMedia = attributesFromMedia( setAttributes );
	const isBlogUrl = isBlobURL( url );

	const toggleParallax = () => {
		setAttributes( {
			hasParallax: ! hasParallax,
			...( ! hasParallax ? { focalPoint: undefined } : {} ),
		} );
	};

	const toggleIsRepeated = () => {
		setAttributes( {
			isRepeated: ! isRepeated,
		} );
	};

	const isDarkElement = useRef();
	const isDark = useCoverIsDark(
		url,
		dimRatio,
		overlayColor.color,
		isDarkElement
	);

	const isImageBackground = IMAGE_BACKGROUND_TYPE === backgroundType;
	const isVideoBackground = VIDEO_BACKGROUND_TYPE === backgroundType;

	const [ temporaryMinHeight, setTemporaryMinHeight ] = useState( null );
	const { removeAllNotices, createErrorNotice } = noticeOperations;

	const minHeightWithUnit = minHeightUnit
		? `${ minHeight }${ minHeightUnit }`
		: minHeight;

	const style = {
		...( isImageBackground ? backgroundImageStyles( url ) : {} ),
		backgroundColor: overlayColor.color,
		minHeight: temporaryMinHeight || minHeightWithUnit || undefined,
	};

	if ( gradientValue && ! url ) {
		style.background = gradientValue;
	}

	let positionValue;

	if ( focalPoint ) {
		positionValue = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
		if ( isImageBackground ) {
			style.backgroundPosition = positionValue;
		}
	}

	const canDim = !! url && ( overlayColor.color || gradientValue );
	const hasBackground = !! ( url || overlayColor.color || gradientValue );
	const showFocalPointPicker =
		isVideoBackground ||
		( isImageBackground && ( ! hasParallax || isRepeated ) );

	const controls = (
		<>
			<BlockControls>
				{ hasBackground && (
					<>
						<BlockAlignmentMatrixToolbar
							label={ __( 'Change content position' ) }
							value={ contentPosition }
							onChange={ ( nextPosition ) =>
								setAttributes( {
									contentPosition: nextPosition,
								} )
							}
						/>

						<MediaReplaceFlow
							mediaId={ id }
							mediaURL={ url }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							accept="image/*,video/*"
							onSelect={ onSelectMedia }
						/>
					</>
				) }
			</BlockControls>
			<InspectorControls>
				{ !! url && (
					<PanelBody title={ __( 'Media settings' ) }>
						{ isImageBackground && (
							<Fragment>
								<ToggleControl
									label={ __( 'Fixed background' ) }
									checked={ hasParallax }
									onChange={ toggleParallax }
								/>

								<ToggleControl
									label={ __( 'Repeated background' ) }
									checked={ isRepeated }
									onChange={ toggleIsRepeated }
								/>
							</Fragment>
						) }
						{ showFocalPointPicker && (
							<FocalPointPicker
								label={ __( 'Focal point picker' ) }
								url={ url }
								value={ focalPoint }
								onChange={ ( newFocalPoint ) =>
									setAttributes( {
										focalPoint: newFocalPoint,
									} )
								}
							/>
						) }
						<PanelRow>
							<Button
								isSecondary
								isSmall
								className="block-library-cover__reset-button"
								onClick={ () =>
									setAttributes( {
										url: undefined,
										id: undefined,
										backgroundType: undefined,
										dimRatio: undefined,
										focalPoint: undefined,
										hasParallax: undefined,
										isRepeated: undefined,
									} )
								}
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
								unit={ minHeightUnit }
								onChange={ ( newMinHeight ) =>
									setAttributes( { minHeight: newMinHeight } )
								}
								onUnitChange={ ( nextUnit ) => {
									setAttributes( {
										minHeightUnit: nextUnit,
									} );
								} }
							/>
						</PanelBody>
						<PanelColorGradientSettings
							title={ __( 'Overlay' ) }
							initialOpen={ true }
							settings={ [
								{
									colorValue: overlayColor.color,
									gradientValue,
									onColorChange: setOverlayColor,
									onGradientChange: setGradient,
									label: __( 'Color' ),
								},
							] }
						>
							{ canDim && (
								<RangeControl
									label={ __( 'Opacity' ) }
									value={ dimRatio }
									onChange={ ( newDimRation ) =>
										setAttributes( {
											dimRatio: newDimRation,
										} )
									}
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

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-cover__inner-container',
		},
		{
			template: INNER_BLOCKS_TEMPLATE,
			templateInsertUpdatesSelection: true,
		}
	);

	if ( ! hasBackground ) {
		const placeholderIcon = <BlockIcon icon={ icon } />;
		const label = __( 'Cover' );

		return (
			<>
				{ controls }
				<div
					{ ...blockProps }
					className={ classnames(
						'is-placeholder',
						blockProps.className
					) }
				>
					<MediaPlaceholder
						icon={ placeholderIcon }
						labels={ {
							title: label,
							instructions: __(
								'Upload an image or video file, or pick one from your media library.'
							),
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
						<div className="wp-block-cover__placeholder-background-options">
							<ColorPalette
								disableCustomColors={ true }
								value={ overlayColor.color }
								onChange={ setOverlayColor }
								clearable={ false }
							/>
						</div>
					</MediaPlaceholder>
				</div>
			</>
		);
	}

	const classes = classnames(
		dimRatioToClass( dimRatio ),
		{
			'is-dark-theme': isDark,
			'has-background-dim': dimRatio !== 0,
			'is-transient': isBlogUrl,
			'has-parallax': hasParallax,
			'is-repeated': isRepeated,
			[ overlayColor.class ]: overlayColor.class,
			'has-background-gradient': gradientValue,
			[ gradientClass ]: ! url && gradientClass,
			'has-custom-content-position': ! isContentPositionCenter(
				contentPosition
			),
		},
		getPositionClassName( contentPosition )
	);

	return (
		<>
			{ controls }
			<div
				{ ...blockProps }
				className={ classnames( classes, blockProps.className ) }
				style={ { ...style, ...blockProps.style } }
				data-url={ url }
			>
				<BoxControlVisualizer
					values={ styleAttribute?.spacing?.padding }
					showValues={ styleAttribute?.visualizers?.padding }
				/>
				<ResizableCover
					className="block-library-cover__resize-container"
					onResizeStart={ () => {
						setAttributes( { minHeightUnit: 'px' } );
						toggleSelection( false );
					} }
					onResize={ setTemporaryMinHeight }
					onResizeStop={ ( newMinHeight ) => {
						toggleSelection( true );
						setAttributes( { minHeight: newMinHeight } );
						setTemporaryMinHeight( null );
					} }
					showHandle={ isSelected }
				/>
				{ isImageBackground && (
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
							gradientClass
						) }
						style={ { background: gradientValue } }
					/>
				) }
				{ isVideoBackground && (
					<video
						ref={ isDarkElement }
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
						style={ { objectPosition: positionValue } }
					/>
				) }
				{ isBlogUrl && <Spinner /> }
				<div { ...innerBlocksProps } />
			</div>
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
