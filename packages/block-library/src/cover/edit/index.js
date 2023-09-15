/**
 * External dependencies
 */
import classnames from 'classnames';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import { compose, useResizeObserver } from '@wordpress/compose';
import {
	withColors,
	ColorPalette,
	useBlockProps,
	useSetting,
	useInnerBlocksProps,
	__experimentalUseGradient,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isBlobURL } from '@wordpress/blob';
import { store as noticesStore } from '@wordpress/notices';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	attributesFromMedia,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	DEFAULT_AVERAGE_COLOR,
	dimRatioToClass,
	isContentPositionCenter,
	getPositionClassName,
	mediaPosition,
} from '../shared';
import CoverInspectorControls from './inspector-controls';
import CoverBlockControls from './block-controls';
import CoverPlaceholder from './cover-placeholder';
import ResizableCoverPopover from './resizable-cover-popover';
import { retrieveFastAverageColor, compositeSourceOver } from './color-utils';

extend( [ namesPlugin ] );

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
 * Computes the average color of an image.
 * @param {string} url
 * @return {Promise<string>} average color in hex
 */
async function computeAverageColor( url ) {
	if ( ! url ) {
		return DEFAULT_AVERAGE_COLOR;
	}

	// making the default color rgb for compat with FAC
	const { r, g, b, a } = colord( DEFAULT_AVERAGE_COLOR ).toRgb();

	try {
		const imgCrossOrigin = applyFilters(
			'media.crossOrigin',
			undefined,
			url
		);
		const color = await retrieveFastAverageColor().getColorAsync( url, {
			// The default color is white, which is the color
			// that is returned if there's an error.
			// colord returns alpga 0-1, FAC needs 0-255
			defaultColor: [ r, g, b, a * 255 ],
			// Errors that come up don't reject the promise,
			// so error logging has to be silenced
			// with this option.
			silent: process.env.NODE_ENV === 'production',
			crossOrigin: imgCrossOrigin,
		} );
		return color.hex;
	} catch ( error ) {
		// If there's an error return the fallback color.
		return DEFAULT_AVERAGE_COLOR;
	}
}

/**
 * Computes if the color combination of the overlay
 * and background color is dark.
 * @param {number} dimRatio
 * @param {string} overlayColor
 * @param {string} backgroundColor
 * @return {boolean} isDark true if the color
 * 									 combination composite result is dark
 */
function computeIsDark( dimRatio, overlayColor, backgroundColor ) {
	const overlay = colord( overlayColor )
		.alpha( dimRatio / 100 )
		.toRgb();
	const background = colord( backgroundColor ).toRgb();
	const composite = compositeSourceOver( overlay, background );
	return colord( composite ).isDark();
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

	// this is used to not reset the overlay color
	// from the average color when the user manually
	// sets the overlay color
	// howeverm, changing the background image
	// should reset the overlay color
	const hasManuallySetOverlayColor = useRef(
		overlayColor.color !== undefined
	);

	// this is a ref to the average color
	// so we don't have to compute it again
	const computedAverageColor = useRef( null );
	const getAverageBackgroundColor = useCallback(
		async ( newUrl ) => {
			if ( originalUrl === newUrl && computedAverageColor.current ) {
				return computedAverageColor.current;
			}
			computedAverageColor.current = await computeAverageColor( newUrl );
			return computedAverageColor.current;
		},
		[ originalUrl ]
	);

	// set the is dark attribute based on the overlay
	// and background color
	const setIsDark = useCallback(
		( newOverlay, newBackground, newDimRatio = dimRatio ) => {
			__unstableMarkNextChangeAsNotPersistent();
			const isDarkSetting = computeIsDark(
				newDimRatio,
				newOverlay,
				newBackground
			);
			setAttributes( {
				isDark: isDarkSetting,
			} );
		},
		[ __unstableMarkNextChangeAsNotPersistent, dimRatio, setAttributes ]
	);

	// set the overlay color based on the average color
	// of the image background
	const setOverlayFromAverageColor = useCallback(
		async ( newMedia ) => {
			if ( hasManuallySetOverlayColor.current === true ) {
				return;
			}
			const newUrl =
				newMedia?.url && newMedia.type === IMAGE_BACKGROUND_TYPE
					? newMedia.url
					: false;
			__unstableMarkNextChangeAsNotPersistent();
			const color = await getAverageBackgroundColor( newUrl );
			setOverlayColor( color );
			setAttributes( { isDark: colord( color ).isDark() } );
		},
		[
			hasManuallySetOverlayColor,
			__unstableMarkNextChangeAsNotPersistent,
			getAverageBackgroundColor,
			setAttributes,
			setOverlayColor,
		]
	);

	// we call this on render since the url is
	// 'hijacked' by the featured image
	useEffect( () => {
		// Set the overlay color to the average color of th
		// featured image and and is dark based on that color.
		const updateFromFeaturedImage = async () => {
			if ( ! useFeaturedImage ) {
				return;
			}
			await setOverlayFromAverageColor( {
				url: mediaUrl,
				type: IMAGE_BACKGROUND_TYPE,
			} );
		};
		updateFromFeaturedImage();
	}, [
		getAverageBackgroundColor,
		mediaUrl,
		overlayColor.color,
		setOverlayFromAverageColor,
		useFeaturedImage,
		originalUrl,
		originalBackgroundType,
	] );

	const { createErrorNotice } = useDispatch( noticesStore );
	const { gradientClass, gradientValue } = __experimentalUseGradient();
	const setMedia = attributesFromMedia( setAttributes, dimRatio );

	const onSelectMedia = async ( newMedia ) => {
		setMedia( newMedia );
		hasManuallySetOverlayColor.current = false;
		await setOverlayFromAverageColor( newMedia );
	};

	const onClearMedia = () => {
		setAttributes( {
			url: undefined,
			id: undefined,
			backgroundType: undefined,
			focalPoint: undefined,
			hasParallax: undefined,
			isRepeated: undefined,
			useFeaturedImage: false,
		} );
		setAttributes( { isDark: colord( overlayColor.color ).isDark() } );
	};

	const onSetOverlayColor = async ( colorValue ) => {
		hasManuallySetOverlayColor.current = true;
		setOverlayColor( colorValue );
		setIsDark( colorValue, await getAverageBackgroundColor( url ) );
	};

	const onUpdateDimRatio = async ( newDimRatio ) => {
		setAttributes( {
			dimRatio: newDimRatio,
		} );
		setIsDark(
			overlayColor.color,
			await getAverageBackgroundColor( url ),
			newDimRatio
		);
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
	const hasFontSizes = !! useSetting( 'typography.fontSizes' )?.length;
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
		hasManuallySetOverlayColor.current = false;
		setAttributes( {
			id: undefined,
			url: undefined,
			useFeaturedImage: ! useFeaturedImage,
			dimRatio: dimRatio === 100 ? 50 : dimRatio,
			backgroundType: useFeaturedImage
				? IMAGE_BACKGROUND_TYPE
				: undefined,
		} );
		setIsDark( overlayColor.color, await getAverageBackgroundColor( url ) );
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
		showHandle: true,
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
							role="img"
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
