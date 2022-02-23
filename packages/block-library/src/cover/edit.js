/**
 * External dependencies
 */
import classnames from 'classnames';
import FastAverageColor from 'fast-average-color';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import {
	BaseControl,
	Button,
	ExternalLink,
	FocalPointPicker,
	PanelBody,
	PanelRow,
	RangeControl,
	ResizableBox,
	Spinner,
	TextareaControl,
	ToggleControl,
	withNotices,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalBoxControl as BoxControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { compose, useInstanceId } from '@wordpress/compose';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	withColors,
	ColorPalette,
	useBlockProps,
	useSetting,
	useInnerBlocksProps,
	__experimentalUseGradient,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalUnitControl as UnitControl,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalBlockFullHeightAligmentControl as FullHeightAlignmentControl,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { cover as icon } from '@wordpress/icons';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import {
	ALLOWED_MEDIA_TYPES,
	attributesFromMedia,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	COVER_MIN_HEIGHT,
	backgroundImageStyles,
	dimRatioToClass,
	isContentPositionCenter,
	getPositionClassName,
} from './shared';

extend( [ namesPlugin ] );

const { __Visualizer: BoxControlVisualizer } = BoxControl;

function getInnerBlocksTemplate( attributes ) {
	return [
		[
			'core/paragraph',
			{
				align: 'center',
				placeholder: __( 'Write title…' ),
				...attributes,
			},
		],
	];
}

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

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
		defaultValues: { px: '430', em: '20', rem: '20', vw: '20', vh: '50' },
	} );

	const handleOnChange = ( unprocessedValue ) => {
		const inputValue =
			unprocessedValue !== ''
				? parseFloat( unprocessedValue )
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
				style={ { maxWidth: 80 } }
				unit={ unit }
				units={ units }
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
			setIsDark( colord( overlayColor ).isDark() );
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

function mediaPosition( { x, y } ) {
	return `${ Math.round( x * 100 ) }% ${ Math.round( y * 100 ) }%`;
}

/**
 * Is the URL a temporary blob URL? A blob URL is one that is used temporarily while
 * the media (image or video) is being uploaded and will not have an id allocated yet.
 *
 * @param {number} id  The id of the media.
 * @param {string} url The url of the media.
 *
 * @return {boolean} Is the URL a Blob URL.
 */
const isTemporaryMedia = ( id, url ) => ! id && isBlobURL( url );

function CoverPlaceholder( {
	disableMediaButtons = false,
	children,
	noticeUI,
	noticeOperations,
	onSelectMedia,
	style,
} ) {
	const { removeAllNotices, createErrorNotice } = noticeOperations;
	return (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ icon } /> }
			labels={ {
				title: __( 'Cover' ),
				instructions: __(
					'Drag and drop onto this block, upload, or select existing media from your library.'
				),
			} }
			onSelect={ onSelectMedia }
			accept="image/*,video/*"
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			notices={ noticeUI }
			disableMediaButtons={ disableMediaButtons }
			onError={ ( message ) => {
				removeAllNotices();
				createErrorNotice( message );
			} }
			style={ style }
		>
			{ children }
		</MediaPlaceholder>
	);
}

function CoverEdit( {
	attributes,
	clientId,
	isSelected,
	noticeUI,
	noticeOperations,
	overlayColor,
	setAttributes,
	setOverlayColor,
	toggleSelection,
} ) {
	const {
		contentPosition,
		id,
		backgroundType,
		dimRatio,
		focalPoint,
		hasParallax,
		isDark,
		isRepeated,
		minHeight,
		minHeightUnit,
		style: styleAttribute,
		url,
		alt,
		allowedBlocks,
		templateLock,
	} = attributes;
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);
	const {
		gradientClass,
		gradientValue,
		setGradient,
	} = __experimentalUseGradient();
	const onSelectMedia = attributesFromMedia( setAttributes, dimRatio );
	const isUploadingMedia = isTemporaryMedia( id, url );

	const [ prevMinHeightValue, setPrevMinHeightValue ] = useState( minHeight );
	const [ prevMinHeightUnit, setPrevMinHeightUnit ] = useState(
		minHeightUnit
	);
	const isMinFullHeight = minHeightUnit === 'vh' && minHeight === 100;

	const toggleMinFullHeight = () => {
		if ( isMinFullHeight ) {
			// If there aren't previous values, take the default ones.
			if ( prevMinHeightUnit === 'vh' && prevMinHeightValue === 100 ) {
				return setAttributes( {
					minHeight: undefined,
					minHeightUnit: undefined,
				} );
			}

			// Set the previous values of height.
			return setAttributes( {
				minHeight: prevMinHeightValue,
				minHeightUnit: prevMinHeightUnit,
			} );
		}

		setPrevMinHeightValue( minHeight );
		setPrevMinHeightUnit( minHeightUnit );

		// Set full height.
		return setAttributes( {
			minHeight: 100,
			minHeightUnit: 'vh',
		} );
	};

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
	const isCoverDark = useCoverIsDark(
		url,
		dimRatio,
		overlayColor.color,
		isDarkElement
	);

	useEffect( () => {
		// This side-effect should not create an undo level.
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { isDark: isCoverDark } );
	}, [ isCoverDark ] );

	const isImageBackground = IMAGE_BACKGROUND_TYPE === backgroundType;
	const isVideoBackground = VIDEO_BACKGROUND_TYPE === backgroundType;

	const minHeightWithUnit = minHeightUnit
		? `${ minHeight }${ minHeightUnit }`
		: minHeight;

	const isImgElement = ! ( hasParallax || isRepeated );

	const style = {
		...( isImageBackground && ! isImgElement
			? backgroundImageStyles( url )
			: undefined ),
		minHeight: minHeightWithUnit || undefined,
	};

	const bgStyle = { backgroundColor: overlayColor.color };
	const mediaStyle = {
		objectPosition:
			focalPoint && isImgElement
				? mediaPosition( focalPoint )
				: undefined,
	};

	const hasBackground = !! ( url || overlayColor.color || gradientValue );
	const showFocalPointPicker =
		isVideoBackground ||
		( isImageBackground && ( ! hasParallax || isRepeated ) );

	const imperativeFocalPointPreview = ( value ) => {
		const [ styleOfRef, property ] = isDarkElement.current
			? [ isDarkElement.current.style, 'objectPosition' ]
			: [ ref.current.style, 'backgroundPosition' ];
		styleOfRef[ property ] = mediaPosition( value );
	};

	const hasInnerBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlock( clientId ).innerBlocks.length >
			0,
		[ clientId ]
	);

	const controls = (
		<>
			<BlockControls group="block">
				<BlockAlignmentMatrixControl
					label={ __( 'Change content position' ) }
					value={ contentPosition }
					onChange={ ( nextPosition ) =>
						setAttributes( {
							contentPosition: nextPosition,
						} )
					}
					isDisabled={ ! hasInnerBlocks }
				/>
				<FullHeightAlignmentControl
					isActive={ isMinFullHeight }
					onToggle={ toggleMinFullHeight }
					isDisabled={ ! hasInnerBlocks }
				/>
			</BlockControls>
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="image/*,video/*"
					onSelect={ onSelectMedia }
					name={ ! url ? __( 'Add Media' ) : __( 'Replace' ) }
				/>
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
								onDragStart={ imperativeFocalPointPreview }
								onDrag={ imperativeFocalPointPreview }
								onChange={ ( newFocalPoint ) =>
									setAttributes( {
										focalPoint: newFocalPoint,
									} )
								}
							/>
						) }
						{ url && isImageBackground && isImgElement && (
							<TextareaControl
								label={ __( 'Alt text (alternative text)' ) }
								value={ alt }
								onChange={ ( newAlt ) =>
									setAttributes( { alt: newAlt } )
								}
								help={
									<>
										<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
											{ __(
												'Describe the purpose of the image'
											) }
										</ExternalLink>
										{ __(
											'Leave empty if the image is purely decorative.'
										) }
									</>
								}
							/>
						) }
						<PanelRow>
							<Button
								variant="secondary"
								isSmall
								className="block-library-cover__reset-button"
								onClick={ () =>
									setAttributes( {
										url: undefined,
										id: undefined,
										backgroundType: undefined,
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
				<PanelColorGradientSettings
					__experimentalHasMultipleOrigins
					__experimentalIsRenderedInSidebar
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
				</PanelColorGradientSettings>
			</InspectorControls>
			<InspectorControls __experimentalGroup="dimensions">
				<ToolsPanelItem
					hasValue={ () => !! minHeight }
					label={ __( 'Minimum height' ) }
					onDeselect={ () =>
						setAttributes( {
							minHeight: undefined,
							minHeightUnit: undefined,
						} )
					}
					resetAllFilter={ () => ( {
						minHeight: undefined,
						minHeightUnit: undefined,
					} ) }
					isShownByDefault={ true }
					panelId={ clientId }
				>
					<CoverHeightInput
						value={ minHeight }
						unit={ minHeightUnit }
						onChange={ ( newMinHeight ) =>
							setAttributes( { minHeight: newMinHeight } )
						}
						onUnitChange={ ( nextUnit ) =>
							setAttributes( {
								minHeightUnit: nextUnit,
							} )
						}
					/>
				</ToolsPanelItem>
			</InspectorControls>
		</>
	);

	const ref = useRef();
	const blockProps = useBlockProps( { ref } );

	// Check for fontSize support before we pass a fontSize attribute to the innerBlocks.
	const hasFontSizes = !! useSetting( 'typography.fontSizes' )?.length;
	const innerBlocksTemplate = getInnerBlocksTemplate( {
		fontSize: hasFontSizes ? 'large' : undefined,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-cover__inner-container',
		},
		{
			template: innerBlocksTemplate,
			templateInsertUpdatesSelection: true,
			allowedBlocks,
			templateLock,
		}
	);

	if ( ! hasInnerBlocks && ! hasBackground ) {
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
					<CoverPlaceholder
						noticeUI={ noticeUI }
						onSelectMedia={ onSelectMedia }
						noticeOperations={ noticeOperations }
						style={ {
							minHeight: minHeightWithUnit || undefined,
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
					</CoverPlaceholder>
					<ResizableCover
						className="block-library-cover__resize-container"
						onResizeStart={ () => {
							setAttributes( { minHeightUnit: 'px' } );
							toggleSelection( false );
						} }
						onResize={ ( value ) => {
							setAttributes( { minHeight: value } );
						} }
						onResizeStop={ ( newMinHeight ) => {
							toggleSelection( true );
							setAttributes( { minHeight: newMinHeight } );
						} }
						showHandle={ isSelected }
					/>
				</div>
			</>
		);
	}

	const classes = classnames(
		{
			'is-dark-theme': isDark,
			'is-light': ! isDark,
			'is-transient': isUploadingMedia,
			'has-parallax': hasParallax,
			'is-repeated': isRepeated,
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
					className="block-library-cover__padding-visualizer"
				/>
				<ResizableCover
					className="block-library-cover__resize-container"
					onResizeStart={ () => {
						setAttributes( { minHeightUnit: 'px' } );
						toggleSelection( false );
					} }
					onResize={ ( value ) => {
						setAttributes( { minHeight: value } );
					} }
					onResizeStop={ ( newMinHeight ) => {
						toggleSelection( true );
						setAttributes( { minHeight: newMinHeight } );
					} }
					showHandle={ isSelected }
				/>

				<span
					aria-hidden="true"
					className={ classnames(
						'wp-block-cover__background',
						dimRatioToClass( dimRatio ),
						{
							[ overlayColor.class ]: overlayColor.class,
							'has-background-dim': dimRatio !== undefined,
							// For backwards compatibility. Former versions of the Cover Block applied
							// `.wp-block-cover__gradient-background` in the presence of
							// media, a gradient and a dim.
							'wp-block-cover__gradient-background':
								url && gradientValue && dimRatio !== 0,
							'has-background-gradient': gradientValue,
							[ gradientClass ]: gradientClass,
						}
					) }
					style={ { backgroundImage: gradientValue, ...bgStyle } }
				/>

				{ url && isImageBackground && isImgElement && (
					<img
						ref={ isDarkElement }
						className="wp-block-cover__image-background"
						alt={ alt }
						src={ url }
						style={ mediaStyle }
					/>
				) }
				{ url && isVideoBackground && (
					<video
						ref={ isDarkElement }
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
						style={ mediaStyle }
					/>
				) }
				{ isUploadingMedia && <Spinner /> }
				<CoverPlaceholder
					disableMediaButtons
					noticeUI={ noticeUI }
					onSelectMedia={ onSelectMedia }
					noticeOperations={ noticeOperations }
				/>
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
	withNotices,
] )( CoverEdit );
