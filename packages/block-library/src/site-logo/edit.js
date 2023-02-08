/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	createInterpolateElement,
	useEffect,
	useState,
	useRef,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import {
	MenuItem,
	PanelBody,
	RangeControl,
	ResizableBox,
	Spinner,
	ToggleControl,
	ToolbarButton,
	Placeholder,
	Button,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	store as blockEditorStore,
	__experimentalImageEditor as ImageEditor,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { crop, upload } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

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
	attributes: { align, width, height, isLink, linkTarget, shouldSyncIcon },
	containerRef,
	isSelected,
	setAttributes,
	setLogo,
	logoUrl,
	siteUrl,
	logoId,
	iconId,
	setIcon,
	canUserEdit,
} ) => {
	const clientWidth = useClientWidth( containerRef, [ align ] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideAligned = [ 'wide', 'full' ].includes( align );
	const isResizable = ! isWideAligned && isLargeViewport;
	const [ { naturalWidth, naturalHeight }, setNaturalSize ] = useState( {} );
	const [ isEditingImage, setIsEditingImage ] = useState( false );
	const { toggleSelection } = useDispatch( blockEditorStore );
	const classes = classnames( 'custom-logo-link', {
		'is-transient': isBlobURL( logoUrl ),
	} );
	const { imageEditing, maxWidth, title } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		const siteEntities = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		);
		return {
			title: siteEntities?.name,
			imageEditing: settings.imageEditing,
			maxWidth: settings.maxWidth,
		};
	}, [] );

	useEffect( () => {
		// Turn the `Use as site icon` toggle off if it is on but the logo and icon have
		// fallen out of sync. This can happen if the toggle is saved in the `on` position,
		// but changes are later made to the site icon in the Customizer.
		if ( shouldSyncIcon && logoId !== iconId ) {
			setAttributes( { shouldSyncIcon: false } );
		}
	}, [] );

	useEffect( () => {
		if ( ! isSelected ) {
			setIsEditingImage( false );
		}
	}, [ isSelected ] );

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
				setNaturalSize( {
					naturalWidth: event.target.naturalWidth,
					naturalHeight: event.target.naturalHeight,
				} );
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

	// Set the default width to a responsible size.
	// Note that this width is also set in the attached frontend CSS file.
	const defaultWidth = 120;

	const currentWidth = width || defaultWidth;
	const ratio = naturalWidth / naturalHeight;
	const currentHeight = currentWidth / ratio;
	const minWidth =
		naturalWidth < naturalHeight ? MIN_SIZE : Math.ceil( MIN_SIZE * ratio );
	const minHeight =
		naturalHeight < naturalWidth ? MIN_SIZE : Math.ceil( MIN_SIZE / ratio );

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

	const canEditImage =
		logoId && naturalWidth && naturalHeight && imageEditing;

	const imgEdit =
		canEditImage && isEditingImage ? (
			<ImageEditor
				id={ logoId }
				url={ logoUrl }
				width={ currentWidth }
				height={ currentHeight }
				clientWidth={ clientWidth }
				naturalHeight={ naturalHeight }
				naturalWidth={ naturalWidth }
				onSaveImage={ ( imageAttributes ) => {
					setLogo( imageAttributes.id );
				} }
				onFinishEditing={ () => {
					setIsEditingImage( false );
				} }
			/>
		) : (
			<ResizableBox
				size={ {
					width: currentWidth,
					height: currentHeight,
				} }
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
		);

	const syncSiteIconHelpText = createInterpolateElement(
		__(
			'Site Icons are what you see in browser tabs, bookmark bars, and within the WordPress mobile apps. To use a custom icon that is different from your site logo, use the <a>Site Icon settings</a>.'
		),
		{
			a: (
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					href={
						siteUrl +
						'/wp-admin/customize.php?autofocus[section]=title_tagline'
					}
					target="_blank"
					rel="noopener noreferrer"
				/>
			),
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<RangeControl
						__nextHasNoMarginBottom
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
					{ canUserEdit && (
						<>
							<ToggleControl
								label={ __( 'Use as site icon' ) }
								onChange={ ( value ) => {
									setAttributes( { shouldSyncIcon: value } );
									setIcon( value ? logoId : undefined );
								} }
								checked={ !! shouldSyncIcon }
								help={ syncSiteIconHelpText }
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<BlockControls group="block">
				{ canEditImage && ! isEditingImage && (
					<ToolbarButton
						onClick={ () => setIsEditingImage( true ) }
						icon={ crop }
						label={ __( 'Crop' ) }
					/>
				) }
			</BlockControls>
			{ imgEdit }
		</>
	);
};

export default function LogoEdit( {
	attributes,
	className,
	setAttributes,
	isSelected,
} ) {
	const { width, shouldSyncIcon } = attributes;
	const ref = useRef();

	const {
		siteLogoId,
		canUserEdit,
		url,
		siteIconId,
		mediaItemData,
		isRequestingMediaItem,
	} = useSelect( ( select ) => {
		const { canUser, getEntityRecord, getEditedEntityRecord } =
			select( coreStore );
		const _canUserEdit = canUser( 'update', 'settings' );
		const siteSettings = _canUserEdit
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;
		const siteData = getEntityRecord( 'root', '__unstableBase' );
		const _siteLogoId = _canUserEdit
			? siteSettings?.site_logo
			: siteData?.site_logo;
		const _siteIconId = siteSettings?.site_icon;
		const mediaItem =
			_siteLogoId &&
			select( coreStore ).getMedia( _siteLogoId, {
				context: 'view',
			} );
		const _isRequestingMediaItem =
			_siteLogoId &&
			! select( coreStore ).hasFinishedResolution( 'getMedia', [
				_siteLogoId,
				{ context: 'view' },
			] );

		return {
			siteLogoId: _siteLogoId,
			canUserEdit: _canUserEdit,
			url: siteData?.home,
			mediaItemData: mediaItem,
			isRequestingMediaItem: _isRequestingMediaItem,
			siteIconId: _siteIconId,
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );

	const setLogo = ( newValue, shouldForceSync = false ) => {
		// `shouldForceSync` is used to force syncing when the attribute
		// may not have updated yet.
		if ( shouldSyncIcon || shouldForceSync ) {
			setIcon( newValue );
		}

		editEntityRecord( 'root', 'site', undefined, {
			site_logo: newValue,
		} );
	};

	const setIcon = ( newValue ) =>
		// The new value needs to be `null` to reset the Site Icon.
		editEntityRecord( 'root', 'site', undefined, {
			site_icon: newValue ?? null,
		} );

	const { alt_text: alt, source_url: logoUrl } = mediaItemData ?? {};

	const onInitialSelectLogo = ( media ) => {
		// Initialize the syncSiteIcon toggle. If we currently have no Site logo and no
		// site icon, automatically sync the logo to the icon.
		if ( shouldSyncIcon === undefined ) {
			const shouldForceSync = ! siteIconId;
			setAttributes( { shouldSyncIcon: shouldForceSync } );

			// Because we cannot rely on the `shouldSyncIcon` attribute to have updated by
			// the time `setLogo` is called, pass an argument to force the syncing.
			onSelectLogo( media, shouldForceSync );
			return;
		}

		onSelectLogo( media );
	};

	const onSelectLogo = ( media, shouldForceSync = false ) => {
		if ( ! media ) {
			return;
		}

		if ( ! media.id && media.url ) {
			// This is a temporary blob image.
			setLogo( undefined );
			return;
		}

		setLogo( media.id, shouldForceSync );
	};

	const onRemoveLogo = () => {
		setLogo( null );
		setAttributes( { width: undefined } );
	};

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const controls = canUserEdit && logoUrl && (
		<BlockControls group="other">
			<MediaReplaceFlow
				mediaURL={ logoUrl }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				accept={ ACCEPT_MEDIA_STRING }
				onSelect={ onSelectLogo }
				onError={ onUploadError }
			>
				<MenuItem onClick={ onRemoveLogo }>{ __( 'Reset' ) }</MenuItem>
			</MediaReplaceFlow>
		</BlockControls>
	);

	let logoImage;
	const isLoading = siteLogoId === undefined || isRequestingMediaItem;
	if ( isLoading ) {
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
				setLogo={ setLogo }
				logoId={ mediaItemData?.id || siteLogoId }
				siteUrl={ url }
				setIcon={ setIcon }
				iconId={ siteIconId }
				canUserEdit={ canUserEdit }
			/>
		);
	}
	const placeholder = ( content ) => {
		const placeholderClassName = classnames(
			'block-editor-media-placeholder',
			className
		);

		return (
			<Placeholder
				className={ placeholderClassName }
				preview={ logoImage }
				withIllustration={ true }
				style={ {
					width,
				} }
			>
				{ content }
			</Placeholder>
		);
	};

	const classes = classnames( className, {
		'is-default-size': ! width,
	} );

	const blockProps = useBlockProps( {
		ref,
		className: classes,
	} );

	const label = __( 'Add a site logo' );

	return (
		<div { ...blockProps }>
			{ controls }
			{ !! logoUrl && logoImage }
			{ ! logoUrl && ! canUserEdit && (
				<Placeholder className="site-logo_placeholder">
					{ !! isLoading && (
						<span className="components-placeholder__preview">
							<Spinner />
						</span>
					) }
				</Placeholder>
			) }
			{ ! logoUrl && canUserEdit && (
				<MediaPlaceholder
					onSelect={ onInitialSelectLogo }
					accept={ ACCEPT_MEDIA_STRING }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onError={ onUploadError }
					placeholder={ placeholder }
					mediaLibraryButton={ ( { open } ) => {
						return (
							<Button
								icon={ upload }
								variant="primary"
								label={ label }
								showTooltip
								tooltipPosition="top center"
								onClick={ () => {
									open();
								} }
							/>
						);
					} }
				/>
			) }
		</div>
	);
}
