/**
 * External dependencies
 */
import classnames from 'classnames';
import { extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import { compose, useResizeObserver, usePrevious } from '@wordpress/compose';
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
import useCoverIsDark from './use-cover-is-dark';
import CoverInspectorControls from './inspector-controls';
import CoverBlockControls from './block-controls';
import CoverPlaceholder from './cover-placeholder';
import ResizableCoverPopover from './resizable-cover-popover';

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
	const setCoverIsDark = useCoverIsDark( setAttributes );
	const media = useSelect(
		( select ) =>
			featuredImage &&
			select( coreStore ).getMedia( featuredImage, { context: 'view' } ),
		[ featuredImage ]
	);
	const mediaUrl = media?.source_url;

	const prevUseFeaturedImage = usePrevious( useFeaturedImage );
	if ( mediaUrl && useFeaturedImage ) {
		setCoverIsDark( mediaUrl, dimRatio, overlayColor.color );
	}

	// An effect is needed here to reset the isDark attribute when the
	// useFeaturedImage attribute is toggled off. Trying to do this outside an
	// effect causes a `cannot update while rendering another component` warning.
	useEffect( () => {
		if ( prevUseFeaturedImage && ! useFeaturedImage ) {
			setCoverIsDark( undefined, dimRatio, overlayColor.color );
		}
	}, [
		dimRatio,
		overlayColor.color,
		prevUseFeaturedImage,
		setCoverIsDark,
		useFeaturedImage,
	] );

	// instead of destructuring the attributes
	// we define the url and background type
	// depending on the value of the useFeaturedImage flag
	// to preview in edit the dynamic featured image
	const url = useFeaturedImage
		? mediaUrl
		: // Ensure the url is not malformed due to sanitization through `wp_kses`.
		  attributes.url?.replaceAll( '&amp;', '&' );
	const backgroundType = useFeaturedImage
		? IMAGE_BACKGROUND_TYPE
		: attributes.backgroundType;

	const { createErrorNotice } = useDispatch( noticesStore );
	const { gradientClass, gradientValue } = __experimentalUseGradient();
	const setMedia = attributesFromMedia( setAttributes, dimRatio );

	const onSelectMedia = async ( newMedia ) => {
		setMedia( newMedia );
		setCoverIsDark( newMedia.url, dimRatio, overlayColor.color );
	};

	const onClearMedia = async () => {
		setAttributes( {
			url: undefined,
			id: undefined,
			backgroundType: undefined,
			focalPoint: undefined,
			hasParallax: undefined,
			isRepeated: undefined,
			useFeaturedImage: false,
		} );
		setCoverIsDark( undefined, dimRatio, overlayColor.color );
	};

	const onSetOverlayColor = async ( colorValue ) => {
		setOverlayColor( colorValue );
		setCoverIsDark( url, dimRatio, colorValue );
	};

	const onUpdateDimRatio = async ( newDimRatio ) => {
		setAttributes( { dimRatio: newDimRatio } );
		setCoverIsDark( url, newDimRatio, overlayColor.color );
	};

	const isUploadingMedia = isTemporaryMedia( id, url );

	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

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

	const toggleUseFeaturedImage = () => {
		setAttributes( {
			id: undefined,
			url: undefined,
			useFeaturedImage: ! useFeaturedImage,
			dimRatio: dimRatio === 100 ? 50 : dimRatio,
			backgroundType: useFeaturedImage
				? IMAGE_BACKGROUND_TYPE
				: undefined,
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
