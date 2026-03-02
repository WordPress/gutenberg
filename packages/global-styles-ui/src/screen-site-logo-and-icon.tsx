/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalTruncate as Truncate,
	__experimentalItemGroup as ItemGroup,
	Button,
	DropZone,
	FlexItem,
	MenuItem,
	Spinner,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import {
	MediaReplaceFlow as _MediaReplaceFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { getFilename } from '@wordpress/url';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';

const MediaReplaceFlow = _MediaReplaceFlow as React.ComponentType< any >;

const ALLOWED_MEDIA_TYPES = [ 'image' ];
const IMAGE_BACKGROUND_TYPE = 'image';

function SiteLogoSection() {
	const [ temporaryURL, setTemporaryURL ] = useState< string >();

	const { siteLogoId, mediaItem, isRequestingMediaItem, canUserEdit } =
		useSelect( ( select: any ) => {
			const { canUser, getEditedEntityRecord, getEntityRecord } =
				select( coreStore );
			const _canUserEdit = canUser( 'update', {
				kind: 'root',
				name: 'site',
			} );
			const siteSettings = _canUserEdit
				? getEditedEntityRecord( 'root', 'site' )
				: undefined;
			const _siteLogoId = siteSettings?.site_logo;
			const _mediaItem =
				_siteLogoId &&
				getEntityRecord( 'postType', 'attachment', _siteLogoId, {
					context: 'view',
				} );
			const _isRequestingMediaItem =
				!! _siteLogoId &&
				! select( coreStore ).hasFinishedResolution(
					'getEntityRecord',
					[
						'postType',
						'attachment',
						_siteLogoId,
						{ context: 'view' },
					]
				);
			return {
				siteLogoId: _siteLogoId,
				mediaItem: _mediaItem,
				isRequestingMediaItem: _isRequestingMediaItem,
				canUserEdit: _canUserEdit,
			};
		}, [] );

	const { getSettings } = useSelect( blockEditorStore );
	const { editEntityRecord }: any = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const setLogo = ( newValue: number | null ) => {
		editEntityRecord( 'root', 'site', undefined, {
			site_logo: newValue,
		} );
	};

	const onSelectMedia = ( media: {
		id?: number;
		url?: string;
		media_type?: string;
		type?: string;
		title?: string;
	} ) => {
		if ( ! media || ! media.url ) {
			setLogo( null );
			setTemporaryURL( undefined );
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		if (
			( media.media_type &&
				media.media_type !== IMAGE_BACKGROUND_TYPE ) ||
			( ! media.media_type &&
				media.type &&
				media.type !== IMAGE_BACKGROUND_TYPE )
		) {
			createErrorNotice(
				__( 'Only images can be used as a site logo.' ),
				{ type: 'snackbar' }
			);
			return;
		}

		if ( media.id ) {
			setLogo( media.id );
		}
		setTemporaryURL( media.url );
	};

	const onRemoveLogo = () => {
		setLogo( null );
		setTemporaryURL( undefined );
	};

	const onUploadError = ( message: string ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const onFilesDrop = ( filesList: File[] ) => {
		const { mediaUpload } = (
			getSettings as () => Record< string, any >
		 )();
		if ( ! mediaUpload ) {
			return;
		}
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange( [ image ]: [ { id?: number; url?: string } ] ) {
				onSelectMedia( image );
			},
			onError: onUploadError,
			multiple: false,
		} );
	};

	// Reset temporary url when the real source url is available.
	useEffect( () => {
		if ( mediaItem?.source_url && temporaryURL ) {
			setTemporaryURL( undefined );
		}
	}, [ mediaItem?.source_url, temporaryURL ] );

	const logoUrl = mediaItem?.source_url || temporaryURL;
	const logoFilename =
		mediaItem?.media_details?.sizes?.full?.file ||
		mediaItem?.slug ||
		getFilename( logoUrl );
	const isUploading = !! temporaryURL && ! mediaItem?.source_url;

	return (
		<VStack spacing={ 2 }>
			<Text className="global-styles-ui-subtitle">
				{ __( 'Site Logo' ) }
			</Text>
			{ isRequestingMediaItem && ! temporaryURL && <Spinner /> }
			{ ( ! isRequestingMediaItem || temporaryURL ) && canUserEdit && (
				<div className="global-styles-ui-site-identity__media-control">
					<MediaReplaceFlow
						mediaId={ siteLogoId }
						mediaURL={ logoUrl }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onSelect={ onSelectMedia }
						onError={ onUploadError }
						name={
							logoUrl ? (
								<ItemGroup as="span">
									<HStack justify="flex-start" as="span">
										<img
											src={ logoUrl }
											alt={ mediaItem?.alt_text || '' }
										/>
										<FlexItem as="span">
											<Truncate numberOfLines={ 1 }>
												{ logoFilename }
											</Truncate>
										</FlexItem>
									</HStack>
								</ItemGroup>
							) : (
								__( 'Choose logo' )
							)
						}
						renderToggle={ ( props: Record< string, any > ) => (
							<Button { ...props } __next40pxDefaultSize>
								{ isUploading ? <Spinner /> : props.children }
							</Button>
						) }
						onReset={ onRemoveLogo }
					>
						{ !! siteLogoId && (
							<MenuItem onClick={ onRemoveLogo }>
								{ __( 'Remove' ) }
							</MenuItem>
						) }
					</MediaReplaceFlow>
					<DropZone onFilesDrop={ onFilesDrop } />
				</div>
			) }
			<Text variant="muted">
				{ __( 'Upload a logo to display in the Site Logo block.' ) }
			</Text>
		</VStack>
	);
}

function SiteIconSection() {
	const [ temporaryURL, setTemporaryURL ] = useState< string >();

	const { siteIconId, siteIconUrl, mediaItem, canUserEdit } = useSelect(
		( select: any ) => {
			const { canUser, getEditedEntityRecord, getEntityRecord } =
				select( coreStore );
			const _canUserEdit = canUser( 'update', {
				kind: 'root',
				name: 'site',
			} );
			const siteSettings = _canUserEdit
				? getEditedEntityRecord( 'root', 'site' )
				: undefined;
			const siteData = getEntityRecord( 'root', '__unstableBase' );
			const _siteIconId = siteSettings?.site_icon;
			const _mediaItem =
				_siteIconId &&
				getEntityRecord( 'postType', 'attachment', _siteIconId, {
					context: 'view',
				} );
			return {
				siteIconId: _siteIconId,
				siteIconUrl: siteData?.site_icon_url,
				mediaItem: _mediaItem,
				canUserEdit: _canUserEdit,
			};
		},
		[]
	);

	const { getSettings } = useSelect( blockEditorStore );
	const { editEntityRecord }: any = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const setIcon = ( newValue: number | null ) => {
		editEntityRecord( 'root', 'site', undefined, {
			site_icon: newValue ?? null,
		} );
	};

	const onSelectMedia = ( media: {
		id?: number;
		url?: string;
		media_type?: string;
		type?: string;
		title?: string;
	} ) => {
		if ( ! media || ! media.url ) {
			setIcon( null );
			setTemporaryURL( undefined );
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		if (
			( media.media_type &&
				media.media_type !== IMAGE_BACKGROUND_TYPE ) ||
			( ! media.media_type &&
				media.type &&
				media.type !== IMAGE_BACKGROUND_TYPE )
		) {
			createErrorNotice(
				__( 'Only images can be used as a site icon.' ),
				{ type: 'snackbar' }
			);
			return;
		}

		if ( media.id ) {
			setIcon( media.id );
		}
		setTemporaryURL( media.url );
	};

	const onRemoveIcon = () => {
		setIcon( null );
		setTemporaryURL( undefined );
	};

	const onUploadError = ( message: string ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const onFilesDrop = ( filesList: File[] ) => {
		const { mediaUpload } = (
			getSettings as () => Record< string, any >
		 )();
		if ( ! mediaUpload ) {
			return;
		}
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange( [ image ]: [ { id?: number; url?: string } ] ) {
				onSelectMedia( image );
			},
			onError: onUploadError,
			multiple: false,
		} );
	};

	// Reset temporary url when the real source url is available.
	useEffect( () => {
		if ( mediaItem?.source_url && temporaryURL ) {
			setTemporaryURL( undefined );
		}
	}, [ mediaItem?.source_url, temporaryURL ] );

	const iconUrl = mediaItem?.source_url || siteIconUrl || temporaryURL;
	const iconFilename =
		mediaItem?.media_details?.sizes?.full?.file ||
		mediaItem?.slug ||
		getFilename( iconUrl );
	const isUploading = !! temporaryURL && ! mediaItem?.source_url;

	return (
		<VStack spacing={ 2 }>
			<Text className="global-styles-ui-subtitle">
				{ __( 'Site Icon' ) }
			</Text>
			{ canUserEdit && (
				<div className="global-styles-ui-site-identity__media-control">
					<MediaReplaceFlow
						mediaId={ siteIconId }
						mediaURL={ iconUrl }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onSelect={ onSelectMedia }
						onError={ onUploadError }
						name={
							iconUrl ? (
								<ItemGroup as="span">
									<HStack justify="flex-start" as="span">
										<img
											src={ iconUrl }
											alt={ __( 'Site icon' ) }
										/>
										<FlexItem as="span">
											<Truncate numberOfLines={ 1 }>
												{ iconFilename }
											</Truncate>
										</FlexItem>
									</HStack>
								</ItemGroup>
							) : (
								__( 'Choose icon' )
							)
						}
						renderToggle={ ( props: Record< string, any > ) => (
							<Button { ...props } __next40pxDefaultSize>
								{ isUploading ? <Spinner /> : props.children }
							</Button>
						) }
						onReset={ onRemoveIcon }
					>
						{ !! siteIconId && (
							<MenuItem onClick={ onRemoveIcon }>
								{ __( 'Remove' ) }
							</MenuItem>
						) }
					</MediaReplaceFlow>
					<DropZone onFilesDrop={ onFilesDrop } />
				</div>
			) }
			<Text variant="muted">
				{ __(
					'Site Icons are what you see in browser tabs, bookmark bars, and within the WordPress mobile apps. To use a custom icon that is different from your site logo, use the Site Icon settings.'
				) }
			</Text>
		</VStack>
	);
}

function ScreenSiteLogoAndIcon() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Site Logo & Icon' ) }
				description={ __(
					'The logo appears wherever the Site Logo block is used, and the icon shows in browser tabs and bookmarks.'
				) }
			/>
			<Spacer paddingX={ 4 }>
				<VStack spacing={ 6 }>
					<SiteLogoSection />
					<SiteIconSection />
				</VStack>
			</Spacer>
		</>
	);
}

export default ScreenSiteLogoAndIcon;
