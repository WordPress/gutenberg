/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	createInterpolateElement,
	useEffect,
	useState,
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
	DropZone,
	FlexItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
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
import { MIN_SIZE } from '../image/constants';

const ALLOWED_MEDIA_TYPES = [ 'image' ];
const ACCEPT_MEDIA_STRING = 'image/*';

const SiteLogo = ( {
	alt,
	attributes: { align, width, height, isLink, linkTarget, shouldSyncIcon },
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
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideAligned = [ 'wide', 'full' ].includes( align );
	const isResizable = ! isWideAligned && isLargeViewport;
	const [ { naturalWidth, naturalHeight }, setNaturalSize ] = useState( {} );
	const [ isEditingImage, setIsEditingImage ] = useState( false );
	const { toggleSelection } = useDispatch( blockEditorStore );
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
		<>
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
			{ isBlobURL( logoUrl ) && <Spinner /> }
		</>
	);

	let imgWrapper = img;

	// Disable reason: Image itself is not meant to be interactive, but
	// should direct focus to block.
	if ( isLink ) {
		imgWrapper = (
			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
			<a
				href={ siteUrl }
				className="custom-logo-link"
				rel="home"
				title={ title }
				onClick={ ( event ) => event.preventDefault() }
			>
				{ img }
			</a>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
		);
	}

	if ( ! isResizable || ! naturalWidth || ! naturalHeight ) {
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

	// Support the previous location for the Site Icon settings. To be removed
	// when the required WP core version for Gutenberg is >= 6.5.0.
	const shouldUseNewUrl = ! window?.__experimentalUseCustomizerSiteLogoUrl;

	const siteIconSettingsUrl = shouldUseNewUrl
		? siteUrl + '/wp-admin/options-general.php'
		: siteUrl + '/wp-admin/customize.php?autofocus[section]=title_tagline';

	const syncSiteIconHelpText = createInterpolateElement(
		__(
			'Site Icons are what you see in browser tabs, bookmark bars, and within the WordPress mobile apps. To use a custom icon that is different from your site logo, use the <a>Site Icon settings</a>.'
		),
		{
			a: (
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					href={ siteIconSettingsUrl }
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
						__next40pxDefaultSize
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
						__nextHasNoMarginBottom
						label={ __( 'Link image to home' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
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
								__nextHasNoMarginBottom
								label={ __( 'Use as Site Icon' ) }
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

// This is a light wrapper around MediaReplaceFlow because the block has two
// different MediaReplaceFlows, one for the inspector and one for the toolbar.
function SiteLogoReplaceFlow( {
	mediaURL,
	onRemoveLogo,
	...mediaReplaceProps
} ) {
	return (
		<MediaReplaceFlow
			{ ...mediaReplaceProps }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			accept={ ACCEPT_MEDIA_STRING }
		>
			{ ( { onClose } ) =>
				mediaURL && (
					<MenuItem
						onClick={ () => {
							onRemoveLogo();
							onClose();
						} }
					>
						{ __( 'Reset' ) }
					</MenuItem>
				)
			}
		</MediaReplaceFlow>
	);
}

const InspectorLogoPreview = ( { mediaItemData = {}, itemGroupProps } ) => {
	const {
		alt_text: alt,
		source_url: logoUrl,
		slug: logoSlug,
		media_details: logoMediaDetails,
	} = mediaItemData;
	const logoLabel = logoMediaDetails?.sizes?.full?.file || logoSlug;
	return (
		<ItemGroup { ...itemGroupProps } as="span">
			<HStack justify="flex-start" as="span">
				<img src={ logoUrl } alt={ alt } />
				<FlexItem as="span">
					<Truncate
						numberOfLines={ 1 }
						className="block-library-site-logo__inspector-media-replace-title"
					>
						{ logoLabel }
					</Truncate>
				</FlexItem>
			</HStack>
		</ItemGroup>
	);
};

export default function LogoEdit( {
	attributes,
	className,
	setAttributes,
	isSelected,
} ) {
	const { width, shouldSyncIcon } = attributes;
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
		const _canUserEdit = canUser( 'update', {
			kind: 'root',
			name: 'site',
		} );
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
	const { getSettings } = useSelect( blockEditorStore );
	const [ temporaryURL, setTemporaryURL ] = useState();

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
			setTemporaryURL( media.url );
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
		setTemporaryURL();
	};

	const onFilesDrop = ( filesList ) => {
		getSettings().mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange( [ image ] ) {
				if ( isBlobURL( image?.url ) ) {
					setTemporaryURL( image.url );
					return;
				}
				onInitialSelectLogo( image );
			},
			onError: onUploadError,
			onRemoveLogo,
		} );
	};

	const mediaReplaceFlowProps = {
		mediaURL: logoUrl,
		name: ! logoUrl ? __( 'Choose logo' ) : __( 'Replace' ),
		onSelect: onSelectLogo,
		onError: onUploadError,
		onRemoveLogo,
	};
	const controls = canUserEdit && (
		<BlockControls group="other">
			<SiteLogoReplaceFlow { ...mediaReplaceFlowProps } />
		</BlockControls>
	);

	let logoImage;
	const isLoading = siteLogoId === undefined || isRequestingMediaItem;
	if ( isLoading ) {
		logoImage = <Spinner />;
	}

	// Reset temporary url when logoUrl is available.
	useEffect( () => {
		if ( logoUrl && temporaryURL ) {
			setTemporaryURL();
		}
	}, [ logoUrl, temporaryURL ] );

	if ( !! logoUrl || !! temporaryURL ) {
		logoImage = (
			<>
				<SiteLogo
					alt={ alt }
					attributes={ attributes }
					className={ className }
					isSelected={ isSelected }
					setAttributes={ setAttributes }
					logoUrl={ temporaryURL || logoUrl }
					setLogo={ setLogo }
					logoId={ mediaItemData?.id || siteLogoId }
					siteUrl={ url }
					setIcon={ setIcon }
					iconId={ siteIconId }
					canUserEdit={ canUserEdit }
				/>
			</>
		);
	}
	const placeholder = ( content ) => {
		const placeholderClassName = clsx(
			'block-editor-media-placeholder',
			className
		);

		return (
			<Placeholder
				className={ placeholderClassName }
				preview={ logoImage }
				withIllustration
				style={ {
					width,
				} }
			>
				{ content }
			</Placeholder>
		);
	};

	const classes = clsx( className, {
		'is-default-size': ! width,
		'is-transient': temporaryURL,
	} );

	const blockProps = useBlockProps( { className: classes } );

	const mediaInspectorPanel = ( canUserEdit || logoUrl ) && (
		<InspectorControls>
			<PanelBody title={ __( 'Media' ) }>
				<div className="block-library-site-logo__inspector-media-replace-container">
					{ ! canUserEdit && !! logoUrl && (
						<InspectorLogoPreview
							mediaItemData={ mediaItemData }
							itemGroupProps={ {
								isBordered: true,
								className:
									'block-library-site-logo__inspector-readonly-logo-preview',
							} }
						/>
					) }
					{ canUserEdit && !! logoUrl && (
						<SiteLogoReplaceFlow
							{ ...mediaReplaceFlowProps }
							name={
								<InspectorLogoPreview
									mediaItemData={ mediaItemData }
								/>
							}
							popoverProps={ {} }
						/>
					) }
					{ canUserEdit && ! logoUrl && (
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onInitialSelectLogo }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								render={ ( { open } ) => (
									<div className="block-library-site-logo__inspector-upload-container">
										<Button
											onClick={ open }
											variant="secondary"
										>
											{ isLoading ? (
												<Spinner />
											) : (
												__( 'Choose logo' )
											) }
										</Button>
										<DropZone onFilesDrop={ onFilesDrop } />
									</div>
								) }
							/>
						</MediaUploadCheck>
					) }
				</div>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<div { ...blockProps }>
			{ controls }
			{ mediaInspectorPanel }
			{ ( !! logoUrl || !! temporaryURL ) && logoImage }
			{ ! temporaryURL && ! logoUrl && ! canUserEdit && (
				<Placeholder className="site-logo_placeholder">
					{ !! isLoading && (
						<span className="components-placeholder__preview">
							<Spinner />
						</span>
					) }
				</Placeholder>
			) }
			{ ! temporaryURL && ! logoUrl && canUserEdit && (
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
								label={ __( 'Choose logo' ) }
								showTooltip
								tooltipPosition="middle right"
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
