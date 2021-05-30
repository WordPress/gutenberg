/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { useState, useRef } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import {
	Notice,
	PanelBody,
	RangeControl,
	ResizableBox,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { siteLogo as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useClientWidth from '../image/use-client-width';

/**
 * Module constants
 */
import { MIN_SIZE } from '../image/constants';

const ALLOWED_MEDIA_TYPES = [ 'image' ];
const ACCEPT_MEDIA_STRING = 'image/*';

const SiteLogo = ( {
	alt,
	attributes: { align, width, height, isLink, linkTarget },
	containerRef,
	isSelected,
	setAttributes,
	logoUrl,
	siteUrl,
} ) => {
	const clientWidth = useClientWidth( containerRef, [ align ] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideAligned = includes( [ 'wide', 'full' ], align );
	const isResizable = ! isWideAligned && isLargeViewport;
	const [ { naturalWidth, naturalHeight }, setNaturalSize ] = useState( {} );
	const { toggleSelection } = useDispatch( blockEditorStore );
	const classes = classnames( 'custom-logo-link', {
		'is-transient': isBlobURL( logoUrl ),
	} );
	const { maxWidth, title } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const siteEntities = select( coreStore ).getEditedEntityRecord(
			'root',
			'site'
		);
		return {
			title: siteEntities.title,
			...pick( getSettings(), [ 'imageSizes', 'maxWidth' ] ),
		};
	} );

	function onResizeStart() {
		toggleSelection( false );
	}

	function onResizeStop() {
		toggleSelection( true );
	}

	const img = (
		<img
			className="custom-logo"
			src={ logoUrl }
			alt={ alt }
			onLoad={ ( event ) => {
				setNaturalSize(
					pick( event.target, [ 'naturalWidth', 'naturalHeight' ] )
				);
			} }
		/>
	);

	let imgWrapper = img;

	// Disable reason: Image itself is not meant to be interactive, but
	// should direct focus to block.
	if ( isLink ) {
		imgWrapper = (
			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
			<a
				href={ siteUrl }
				className={ classes }
				rel="home"
				title={ title }
				onClick={ ( event ) => event.preventDefault() }
			>
				{ img }
			</a>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
		);
	}

	let imageWidthWithinContainer;

	if ( clientWidth && naturalWidth && naturalHeight ) {
		const exceedMaxWidth = naturalWidth > clientWidth;
		imageWidthWithinContainer = exceedMaxWidth ? clientWidth : naturalWidth;
	}

	if ( ! isResizable || ! imageWidthWithinContainer ) {
		return <div style={ { width, height } }>{ imgWrapper }</div>;
	}

	const currentWidth = width || imageWidthWithinContainer;
	const ratio = naturalWidth / naturalHeight;
	const currentHeight = currentWidth / ratio;
	const minWidth = naturalWidth < naturalHeight ? MIN_SIZE : MIN_SIZE * ratio;
	const minHeight =
		naturalHeight < naturalWidth ? MIN_SIZE : MIN_SIZE / ratio;

	// With the current implementation of ResizableBox, an image needs an
	// explicit pixel value for the max-width. In absence of being able to
	// set the content-width, this max-width is currently dictated by the
	// vanilla editor style. The following variable adds a buffer to this
	// vanilla style, so 3rd party themes have some wiggleroom. This does,
	// in most cases, allow you to scale the image beyond the width of the
	// main column, though not infinitely.
	// @todo It would be good to revisit this once a content-width variable
	// becomes available.
	const maxWidthBuffer = maxWidth * 2.5;

	// Set the default width to a responsible size.
	// Note that this width is also set in the attached CSS file.
	const defaultWidth = 120;

	let showRightHandle = false;
	let showLeftHandle = false;

	/* eslint-disable no-lonely-if */
	// See https://github.com/WordPress/gutenberg/issues/7584.
	if ( align === 'center' ) {
		// When the image is centered, show both handles.
		showRightHandle = true;
		showLeftHandle = true;
	} else if ( isRTL() ) {
		// In RTL mode the image is on the right by default.
		// Show the right handle and hide the left handle only when it is
		// aligned left. Otherwise always show the left handle.
		if ( align === 'left' ) {
			showRightHandle = true;
		} else {
			showLeftHandle = true;
		}
	} else {
		// Show the left handle and hide the right handle only when the
		// image is aligned right. Otherwise always show the right handle.
		if ( align === 'right' ) {
			showLeftHandle = true;
		} else {
			showRightHandle = true;
		}
	}
	/* eslint-enable no-lonely-if */

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<RangeControl
						label={ __( 'Image width' ) }
						onChange={ ( newWidth ) =>
							setAttributes( { width: newWidth } )
						}
						min={ minWidth }
						max={ maxWidthBuffer }
						initialPosition={ Math.min(
							defaultWidth,
							maxWidthBuffer
						) }
						value={ width || '' }
						disabled={ ! isResizable }
					/>
					<ToggleControl
						label={ __( 'Link image to home' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<ResizableBox
				size={ { width, height } }
				showHandle={ isSelected }
				minWidth={ minWidth }
				maxWidth={ maxWidthBuffer }
				minHeight={ minHeight }
				maxHeight={ maxWidthBuffer / ratio }
				lockAspectRatio
				enable={ {
					top: false,
					right: showRightHandle,
					bottom: true,
					left: showLeftHandle,
				} }
				onResizeStart={ onResizeStart }
				onResizeStop={ ( event, direction, elt, delta ) => {
					onResizeStop();
					setAttributes( {
						width: parseInt( currentWidth + delta.width, 10 ),
						height: parseInt( currentHeight + delta.height, 10 ),
					} );
				} }
			>
				{ imgWrapper }
			</ResizableBox>
		</>
	);
};

export default function LogoEdit( {
	attributes,
	className,
	setAttributes,
	isSelected,
} ) {
	const { width } = attributes;
	const [ logoUrl, setLogoUrl ] = useState();
	const [ error, setError ] = useState();
	const ref = useRef();
	const { mediaItemData, siteLogo, url } = useSelect( ( select ) => {
		const siteSettings = select( coreStore ).getEditedEntityRecord(
			'root',
			'site'
		);
		const mediaItem = siteSettings.site_logo
			? select( coreStore ).getEntityRecord(
					'root',
					'media',
					siteSettings.site_logo
			  )
			: null;
		return {
			mediaItemData: mediaItem && {
				url: mediaItem.source_url,
				alt: mediaItem.alt_text,
			},
			siteLogo: siteSettings.site_logo,
			url: siteSettings.url,
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );
	const setLogo = ( newValue ) =>
		editEntityRecord( 'root', 'site', undefined, {
			site_logo: newValue,
		} );

	let alt = null;
	if ( mediaItemData ) {
		alt = mediaItemData.alt;
		if ( logoUrl !== mediaItemData.url ) {
			setLogoUrl( mediaItemData.url );
		}
	}

	const onSelectLogo = ( media ) => {
		if ( ! media ) {
			return;
		}

		if ( ! media.id && media.url ) {
			// This is a temporary blob image
			setLogo( undefined );
			setError( null );
			setLogoUrl( media.url );
			return;
		}

		setLogo( media.id );
	};

	const onUploadError = ( message ) => {
		setError( message[ 2 ] ? message[ 2 ] : null );
	};

	const controls = logoUrl && (
		<BlockControls group="other">
			<MediaReplaceFlow
				mediaURL={ logoUrl }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				accept={ ACCEPT_MEDIA_STRING }
				onSelect={ onSelectLogo }
				onError={ onUploadError }
			/>
		</BlockControls>
	);

	const label = __( 'Site Logo' );
	let logoImage;
	if ( siteLogo === undefined ) {
		logoImage = <Spinner />;
	}

	if ( !! logoUrl ) {
		logoImage = (
			<SiteLogo
				alt={ alt }
				attributes={ attributes }
				className={ className }
				containerRef={ ref }
				isSelected={ isSelected }
				setAttributes={ setAttributes }
				logoUrl={ logoUrl }
				siteUrl={ url }
			/>
		);
	}

	const mediaPlaceholder = (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ icon } /> }
			labels={ {
				title: label,
				instructions: __(
					'Upload an image, or pick one from your media library, to be your site logo'
				),
			} }
			onSelect={ onSelectLogo }
			accept={ ACCEPT_MEDIA_STRING }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			mediaPreview={ logoImage }
			notices={
				error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				)
			}
			onError={ onUploadError }
		/>
	);

	const classes = classnames( className, {
		'is-default-size': ! width,
	} );

	const blockProps = useBlockProps( {
		ref,
		className: classes,
	} );

	return (
		<div { ...blockProps }>
			{ controls }
			{ logoUrl && logoImage }
			{ ! logoUrl && mediaPlaceholder }
		</div>
	);
}
