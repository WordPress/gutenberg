/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import { compose, useResizeObserver } from '@wordpress/compose';
import {
	withColors,
	ColorPalette,
	useBlockProps,
	useSettings,
	useInnerBlocksProps,
	__experimentalUseGradient,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isBlobURL } from '@wordpress/blob';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	attributesFromMedia,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	dimRatioToClass,
	isContentPositionCenter,
	getPositionClassName,
	mediaPosition,
} from '../shared';
import CoverInspectorControls from './inspector-controls';
import CoverBlockControls from './block-controls';
import CoverPlaceholder from './cover-placeholder';
import ResizableCoverPopover from './resizable-cover-popover';
import {
	getMediaColor,
	compositeIsDark,
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_OVERLAY_COLOR,
} from './color-utils';

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

function CoverEdit( {
	attributes,
	clientId,
	isSelected,
	overlayColor,
	setAttributes,
	setOverlayColor,
	toggleSelection,
	context: { postId, postType },
} ) {
	const {
		contentPosition,
		id,
		url: originalUrl,
		backgroundType: originalBackgroundType,
		useFeaturedImage,
		dimRatio,
		focalPoint,
		hasParallax,
		isDark,
		isRepeated,
		minHeight,
		minHeightUnit,
		alt,
		allowedBlocks,
		templateLock,
		tagName: TagName = 'div',
		isUserOverlayColor,
	} = attributes;

	const [ featuredImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const media = useSelect(
		( select ) =>
			featuredImage &&
			select( coreStore ).getMedia( featuredImage, { context: 'view' } ),
		[ featuredImage ]
	);
	const mediaUrl = media?.source_url;

	// User can change the featured image outside of the block, but we still
	// need to update the block when that happens. This effect should only
	// run when the featured image changes in that case. All other cases are
	// handled in their respective callbacks.
	useEffect( () => {
		( async () => {
			if ( ! useFeaturedImage ) {
				return;
			}

			const averageBackgroundColor = await getMediaColor( mediaUrl );

			let newOverlayColor = overlayColor.color;
			if ( ! isUserOverlayColor ) {
				newOverlayColor = averageBackgroundColor;
				__unstableMarkNextChangeAsNotPersistent();
				setOverlayColor( newOverlayColor );
			}

			const newIsDark = compositeIsDark(
				dimRatio,
				newOverlayColor,
				averageBackgroundColor
			);
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { isDark: newIsDark } );
		} )();
		// Disable reason: Update the block only when the featured image changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ mediaUrl ] );

	// instead of destructuring the attributes
	// we define the url and background type
	// depending on the value of the useFeaturedImage flag
	// to preview in edit the dynamic featured image
	const url = useFeaturedImage
		? mediaUrl
		: // Ensure the url is not malformed due to sanitization through `wp_kses`.
		  originalUrl?.replaceAll( '&amp;', '&' );
	const backgroundType = useFeaturedImage
		? IMAGE_BACKGROUND_TYPE
		: originalBackgroundType;

	const { createErrorNotice } = useDispatch( noticesStore );
	const { gradientClass, gradientValue } = __experimentalUseGradient();

	const onSelectMedia = async ( newMedia ) => {
		const mediaAttributes = attributesFromMedia( newMedia );
		const isImage = [ newMedia?.type, newMedia?.media_type ].includes(
			IMAGE_BACKGROUND_TYPE
		);

		const averageBackgroundColor = await getMediaColor(
			isImage ? newMedia?.url : undefined
		);

		let newOverlayColor = overlayColor.color;
		if ( ! isUserOverlayColor ) {
			newOverlayColor = averageBackgroundColor;
			setOverlayColor( newOverlayColor );

			// Make undo revert the next setAttributes and the previous setOverlayColor.
			__unstableMarkNextChangeAsNotPersistent();
		}

		// Only set a new dimRatio if there was no previous media selected
		// to avoid resetting to 50 if it has been explicitly set to 100.
		// See issue #52835 for context.
		const newDimRatio =
			originalUrl === undefined && dimRatio === 100 ? 50 : dimRatio;

		const newIsDark = compositeIsDark(
			newDimRatio,
			newOverlayColor,
			averageBackgroundColor
		);

		setAttributes( {
			...mediaAttributes,
			focalPoint: undefined,
			useFeaturedImage: undefined,
			dimRatio: newDimRatio,
			isDark: newIsDark,
		} );
	};

	const onClearMedia = () => {
		let newOverlayColor = overlayColor.color;
		if ( ! isUserOverlayColor ) {
			newOverlayColor = DEFAULT_OVERLAY_COLOR;
			setOverlayColor( undefined );

			// Make undo revert the next setAttributes and the previous setOverlayColor.
			__unstableMarkNextChangeAsNotPersistent();
		}

		const newIsDark = compositeIsDark(
			dimRatio,
			newOverlayColor,
			DEFAULT_BACKGROUND_COLOR
		);

		setAttributes( {
			url: undefined,
			id: undefined,
			backgroundType: undefined,
			focalPoint: undefined,
			hasParallax: undefined,
			isRepeated: undefined,
			useFeaturedImage: undefined,
			isDark: newIsDark,
		} );
	};

	const onSetOverlayColor = async ( newOverlayColor ) => {
		const averageBackgroundColor = await getMediaColor( url );
		const newIsDark = compositeIsDark(
			dimRatio,
			newOverlayColor,
			averageBackgroundColor
		);

		setOverlayColor( newOverlayColor );

		// Make undo revert the next setAttributes and the previous setOverlayColor.
		__unstableMarkNextChangeAsNotPersistent();

		setAttributes( {
			isUserOverlayColor: true,
			isDark: newIsDark,
		} );
	};

	const onUpdateDimRatio = async ( newDimRatio ) => {
		const averageBackgroundColor = await getMediaColor( url );
		const newIsDark = compositeIsDark(
			newDimRatio,
			overlayColor.color,
			averageBackgroundColor
		);

		setAttributes( {
			dimRatio: newDimRatio,
			isDark: newIsDark,
		} );
	};

	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const isUploadingMedia = isTemporaryMedia( id, url );

	const isImageBackground = IMAGE_BACKGROUND_TYPE === backgroundType;
	const isVideoBackground = VIDEO_BACKGROUND_TYPE === backgroundType;

	const [ resizeListener, { height, width } ] = useResizeObserver();
	const resizableBoxDimensions = useMemo( () => {
		return {
			height: minHeightUnit === 'px' ? minHeight : 'auto',
			width: 'auto',
		};
	}, [ minHeight, minHeightUnit ] );

	const minHeightWithUnit =
		minHeight && minHeightUnit
			? `${ minHeight }${ minHeightUnit }`
			: minHeight;

	const isImgElement = ! ( hasParallax || isRepeated );

	const style = {
		minHeight: minHeightWithUnit || undefined,
	};

	const backgroundImage = url ? `url(${ url })` : undefined;

	const backgroundPosition = mediaPosition( focalPoint );

	const bgStyle = { backgroundColor: overlayColor.color };
	const mediaStyle = {
		objectPosition:
			focalPoint && isImgElement
				? mediaPosition( focalPoint )
				: undefined,
	};

	const hasBackground = !! ( url || overlayColor.color || gradientValue );

	const hasInnerBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlock( clientId ).innerBlocks.length >
			0,
		[ clientId ]
	);

	const ref = useRef();
	const blockProps = useBlockProps( { ref } );

	// Check for fontSize support before we pass a fontSize attribute to the innerBlocks.
	const [ fontSizes ] = useSettings( 'typography.fontSizes' );
	const hasFontSizes = fontSizes?.length > 0;
	const innerBlocksTemplate = getInnerBlocksTemplate( {
		fontSize: hasFontSizes ? 'large' : undefined,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-cover__inner-container',
		},
		{
			// Avoid template sync when the `templateLock` value is `all` or `contentOnly`.
			// See: https://github.com/WordPress/gutenberg/pull/45632
			template: ! hasInnerBlocks ? innerBlocksTemplate : undefined,
			templateInsertUpdatesSelection: true,
			allowedBlocks,
			templateLock,
			dropZoneElement: ref.current,
		}
	);

	const mediaElement = useRef();
	const currentSettings = {
		isVideoBackground,
		isImageBackground,
		mediaElement,
		hasInnerBlocks,
		url,
		isImgElement,
		overlayColor,
	};

	const toggleUseFeaturedImage = async () => {
		const newUseFeaturedImage = ! useFeaturedImage;

		const averageBackgroundColor = newUseFeaturedImage
			? await getMediaColor( mediaUrl )
			: DEFAULT_BACKGROUND_COLOR;

		const newOverlayColor = ! isUserOverlayColor
			? averageBackgroundColor
			: overlayColor.color;

		if ( ! isUserOverlayColor ) {
			if ( newUseFeaturedImage ) {
				setOverlayColor( newOverlayColor );
			} else {
				setOverlayColor( undefined );
			}

			// Make undo revert the next setAttributes and the previous setOverlayColor.
			__unstableMarkNextChangeAsNotPersistent();
		}

		const newDimRatio = dimRatio === 100 ? 50 : dimRatio;
		const newIsDark = compositeIsDark(
			newDimRatio,
			newOverlayColor,
			averageBackgroundColor
		);

		setAttributes( {
			id: undefined,
			url: undefined,
			useFeaturedImage: newUseFeaturedImage,
			dimRatio: newDimRatio,
			backgroundType: useFeaturedImage
				? IMAGE_BACKGROUND_TYPE
				: undefined,
			isDark: newIsDark,
		} );
	};

	const blockControls = (
		<CoverBlockControls
			attributes={ attributes }
			setAttributes={ setAttributes }
			onSelectMedia={ onSelectMedia }
			currentSettings={ currentSettings }
			toggleUseFeaturedImage={ toggleUseFeaturedImage }
		/>
	);

	const inspectorControls = (
		<CoverInspectorControls
			attributes={ attributes }
			setAttributes={ setAttributes }
			clientId={ clientId }
			setOverlayColor={ onSetOverlayColor }
			coverRef={ ref }
			currentSettings={ currentSettings }
			toggleUseFeaturedImage={ toggleUseFeaturedImage }
			updateDimRatio={ onUpdateDimRatio }
			onClearMedia={ onClearMedia }
		/>
	);

	const resizableCoverProps = {
		className: 'block-library-cover__resize-container',
		clientId,
		height,
		minHeight: minHeightWithUnit,
		onResizeStart: () => {
			setAttributes( { minHeightUnit: 'px' } );
			toggleSelection( false );
		},
		onResize: ( value ) => {
			setAttributes( { minHeight: value } );
		},
		onResizeStop: ( newMinHeight ) => {
			toggleSelection( true );
			setAttributes( { minHeight: newMinHeight } );
		},
		// Hide the resize handle if an aspect ratio is set, as the aspect ratio takes precedence.
		showHandle: ! attributes.style?.dimensions?.aspectRatio ? true : false,
		size: resizableBoxDimensions,
		width,
	};

	if ( ! useFeaturedImage && ! hasInnerBlocks && ! hasBackground ) {
		return (
			<>
				{ blockControls }
				{ inspectorControls }
				{ isSelected && (
					<ResizableCoverPopover { ...resizableCoverProps } />
				) }
				<TagName
					{ ...blockProps }
					className={ classnames(
						'is-placeholder',
						blockProps.className
					) }
					style={ {
						...blockProps.style,
						minHeight: minHeightWithUnit || undefined,
					} }
				>
					{ resizeListener }
					<CoverPlaceholder
						onSelectMedia={ onSelectMedia }
						onError={ onUploadError }
						toggleUseFeaturedImage={ toggleUseFeaturedImage }
					>
						<div className="wp-block-cover__placeholder-background-options">
							<ColorPalette
								disableCustomColors={ true }
								value={ overlayColor.color }
								onChange={ onSetOverlayColor }
								clearable={ false }
							/>
						</div>
					</CoverPlaceholder>
				</TagName>
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
			'has-custom-content-position':
				! isContentPositionCenter( contentPosition ),
		},
		getPositionClassName( contentPosition )
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<TagName
				{ ...blockProps }
				className={ classnames( classes, blockProps.className ) }
				style={ { ...style, ...blockProps.style } }
				data-url={ url }
			>
				{ resizeListener }
				{ ( ! useFeaturedImage || url ) && (
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
				) }

				{ ! url && useFeaturedImage && (
					<Placeholder
						className="wp-block-cover__image--placeholder-image"
						withIllustration={ true }
					/>
				) }

				{ url &&
					isImageBackground &&
					( isImgElement ? (
						<img
							ref={ mediaElement }
							className="wp-block-cover__image-background"
							alt={ alt }
							src={ url }
							style={ mediaStyle }
						/>
					) : (
						<div
							ref={ mediaElement }
							role={ alt ? 'img' : undefined }
							aria-label={ alt ? alt : undefined }
							className={ classnames(
								classes,
								'wp-block-cover__image-background'
							) }
							style={ { backgroundImage, backgroundPosition } }
						/>
					) ) }
				{ url && isVideoBackground && (
					<video
						ref={ mediaElement }
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
					onSelectMedia={ onSelectMedia }
					onError={ onUploadError }
					toggleUseFeaturedImage={ toggleUseFeaturedImage }
				/>
				<div { ...innerBlocksProps } />
			</TagName>
			{ isSelected && (
				<ResizableCoverPopover { ...resizableCoverProps } />
			) }
		</>
	);
}

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
] )( CoverEdit );
