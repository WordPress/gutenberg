import {
	Button,
	DropZone,
	FlexBlock,
	Spinner as WCSpinner,
	__experimentalItemGroup as WCItemGroup,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import {
	MediaReplaceFlow,
	store as blockEditorStore,
	type MediaUploadFunction,
} from '@wordpress/block-editor';
import { focus } from '@wordpress/dom';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	Icon,
	audio as audioIcon,
	file as fileIcon,
	plus as plusIcon,
	reset as resetIcon,
	video as videoIcon,
} from '@wordpress/icons';
import type { RefObject } from 'react';
import { getFilename } from '@wordpress/url';
import type {
	MediaControlIndicatorProps,
	MediaControlPreviewProps,
	MediaControlProps,
} from './types';

const MEDIA_TYPE_ICONS: Record< string, typeof audioIcon > = {
	audio: audioIcon,
	video: videoIcon,
};

/**
 * Focuses the toggle button.
 *
 * @param containerRef - ref object containing current element
 */
const focusToggleButton = (
	containerRef: RefObject< HTMLDivElement | null >
) => {
	// Use requestAnimationFrame to ensure DOM updates are complete.
	window.requestAnimationFrame( () => {
		const [ toggleButton ] = focus.tabbable.find( containerRef.current! );
		if ( ! toggleButton ) {
			return;
		}

		toggleButton.focus();
	} );
};

/**
 * MediaControlIndicator - The slot left of the label: a `+` when no media is
 * set, a thumbnail for an image, and an icon for any other media type.
 *
 * @param props
 * @param props.url       Media URL
 * @param props.mediaType Media type
 * @return Indicator component
 */
function MediaControlIndicator( {
	url,
	mediaType,
}: MediaControlIndicatorProps ) {
	if ( url && mediaType === 'image' ) {
		return (
			<span
				className="block-library-utils__media-control__inspector-image-indicator"
				style={ { backgroundImage: `url(${ url })` } }
			/>
		);
	}

	const typeIcon = MEDIA_TYPE_ICONS[ mediaType! ] ?? fileIcon;

	return (
		<span className="block-library-utils__media-control__inspector-icon-indicator">
			<Icon icon={ url ? typeIcon : plusIcon } />
		</span>
	);
}

/**
 * MediaControlPreview - Preview component showing media thumbnail and filename
 *
 * @param props
 * @param props.url            Media URL for thumbnail
 * @param props.mediaType      Media type: 'image', 'video', 'audio', or any other type for a generic file (default: 'image')
 * @param props.filename       Filename to display
 * @param props.itemGroupProps Optional props to pass to WCItemGroup
 * @param props.className      Optional className for Truncate
 * @param props.label          Optional label for accessibility
 * @return Preview component
 */
export function MediaControlPreview( {
	url,
	mediaType = 'image',
	filename,
	itemGroupProps,
	className,
	label,
}: MediaControlPreviewProps ) {
	return (
		<WCItemGroup { ...itemGroupProps } as="span">
			<HStack justify="flex-start">
				<MediaControlIndicator url={ url } mediaType={ mediaType } />
				<FlexBlock>
					<Truncate numberOfLines={ 1 } className={ className }>
						{ filename ?? label }
					</Truncate>
				</FlexBlock>
			</HStack>
		</WCItemGroup>
	);
}

/**
 * MediaControl - Complete media selection control for inspector panels
 *
 * @param props
 * @param props.mediaId               Media attachment ID
 * @param props.mediaUrl              Media URL
 * @param props.mediaType             Media type: 'image', 'video', 'audio', or any other type for a generic file (default: 'image')
 * @param props.filename              Filename to display
 * @param props.allowedTypes          Allowed media types
 * @param props.onSelect              Callback when media selected
 * @param props.onSelectURL           Callback when URL entered
 * @param props.onError               Error callback
 * @param props.onReset               Reset/remove callback
 * @param props.isUploading           Whether upload in progress
 * @param props.emptyLabel            Label when no media (default: 'Add media')
 * @param props.useFeaturedImage      Whether the featured image is in use
 * @param props.onToggleFeaturedImage Callback toggling the featured image
 * @return Media control component
 */
export function MediaControl( {
	mediaId,
	mediaUrl,
	mediaType,
	filename,
	allowedTypes,
	onSelect,
	onSelectURL,
	onError,
	onReset,
	isUploading = false,
	emptyLabel = __( 'Media' ),
	useFeaturedImage,
	onToggleFeaturedImage,
}: MediaControlProps ) {
	const { getSettings } = useSelect( blockEditorStore );
	const onFilesDrop = ( filesList: File[] ) => {
		const mediaUpload = getSettings().mediaUpload as
			MediaUploadFunction | undefined;
		if ( ! mediaUpload ) {
			return;
		}
		mediaUpload( {
			allowedTypes,
			filesList,
			onFileChange( [ media ] ) {
				onSelect( media );
			},
			onError,
			multiple: false,
		} );
	};
	const containerRef = useRef< HTMLDivElement >( null );

	return (
		<div
			ref={ containerRef }
			className="block-library-utils__media-control"
		>
			<MediaReplaceFlow
				className="block-library-utils__media-control__replace-flow"
				mediaId={ mediaId }
				mediaURL={ mediaUrl }
				allowedTypes={ allowedTypes }
				onSelect={ onSelect }
				onSelectURL={ onSelectURL }
				onError={ onError }
				useFeaturedImage={ useFeaturedImage }
				onToggleFeaturedImage={ onToggleFeaturedImage }
				name={
					<MediaControlPreview
						url={ mediaUrl }
						mediaType={ mediaType }
						filename={ filename }
						className="block-library-utils__media-control__inspector-media-replace-title"
						label={
							mediaUrl
								? getFilename( filename! ) || emptyLabel
								: emptyLabel
						}
					/>
				}
				renderToggle={ ( props ) => (
					<Button { ...props } __next40pxDefaultSize>
						{ isUploading ? <WCSpinner /> : props.children }
					</Button>
				) }
				onReset={ onReset }
			/>
			{ mediaUrl && onReset && (
				<Button
					label={ __( 'Reset' ) }
					className="block-library-utils__media-control__reset"
					size="small"
					icon={ resetIcon }
					onClick={ () => {
						onReset();
						focusToggleButton( containerRef );
					} }
				/>
			) }
			<DropZone onFilesDrop={ onFilesDrop } />
		</div>
	);
}
