/**
 * WordPress dependencies
 */
import {
	Button,
	DropZone,
	FlexBlock,
	Spinner,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import {
	MediaReplaceFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { reset as resetIcon } from '@wordpress/icons';
import { getFilename } from '@wordpress/url';

/**
 * MediaControlPreview - Preview component showing media thumbnail and filename
 *
 * @param {Object} props
 * @param {string} props.url            Media URL for thumbnail
 * @param {string} props.alt            Alt text for image
 * @param {string} props.filename       Filename to display
 * @param {Object} props.itemGroupProps Optional props to pass to ItemGroup
 * @param {string} props.className      Optional className for Truncate
 * @param {string} props.label          Optional label for accessibility
 * @return {Element} Preview component
 */
export function MediaControlPreview( {
	url,
	alt,
	filename,
	itemGroupProps,
	className,
	label,
} ) {
	return (
		<ItemGroup { ...itemGroupProps } as="span">
			<HStack justify="flex-start">
				<span
					className="block-library-utils__media-control__inspector-image-indicator"
					aria-label={ alt }
					style={ {
						backgroundImage: url ? `url(${ url })` : undefined,
					} }
				/>
				<FlexBlock>
					<Truncate numberOfLines={ 1 } className={ className }>
						{ filename ?? label }
					</Truncate>
				</FlexBlock>
			</HStack>
		</ItemGroup>
	);
}

/**
 * MediaControl - Complete media selection control for inspector panels
 *
 * @param {Object}   props
 * @param {number}   props.mediaId      Media attachment ID
 * @param {string}   props.mediaUrl     Media URL
 * @param {string}   props.alt          Alt text for preview
 * @param {string}   props.filename     Filename to display
 * @param {Array}    props.allowedTypes Allowed media types
 * @param {Function} props.onSelect     Callback when media selected
 * @param {Function} props.onSelectURL  Callback when URL entered
 * @param {Function} props.onError      Error callback
 * @param {Function} props.onReset      Reset/remove callback
 * @param {boolean}  props.isUploading  Whether upload in progress
 * @param {string}   props.emptyLabel   Label when no media (default: 'Add media')
 * @return {Element} Media control component
 */
export function MediaControl( {
	mediaId,
	mediaUrl,
	alt = '',
	filename,
	allowedTypes,
	onSelect,
	onSelectURL,
	onError,
	onReset,
	isUploading = false,
	emptyLabel = __( 'Add media' ),
} ) {
	const { getSettings } = useSelect( blockEditorStore );
	const onFilesDrop = ( filesList ) => {
		const { mediaUpload } = getSettings();
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

	return (
		<div className="block-library-utils__media-control">
			<div className="block-library-utils__media-control__replace-flow">
				<MediaReplaceFlow
					mediaId={ mediaId }
					mediaURL={ mediaUrl }
					allowedTypes={ allowedTypes }
					onSelect={ onSelect }
					onSelectURL={ onSelectURL }
					onError={ onError }
					name={
						<MediaControlPreview
							url={ mediaUrl ?? undefined }
							alt={ mediaUrl ? alt : undefined }
							filename={ mediaUrl ? filename : undefined }
							className="block-library-utils__media-control__inspector-media-replace-title"
							label={
								mediaUrl ? getFilename( filename ) : emptyLabel
							}
							itemGroupProps={ {
								className:
									'block-library-utils__media-control__inspector-preview-inner',
							} }
						/>
					}
					renderToggle={ ( props ) => (
						<Button { ...props } __next40pxDefaultSize>
							{ isUploading ? <Spinner /> : props.children }
						</Button>
					) }
					onReset={ onReset }
				/>
			</div>
			{ mediaUrl && onReset && (
				<Button
					__next40pxDefaultSize
					label={ __( 'Reset' ) }
					className="block-library-utils__media-control__reset"
					size="small"
					icon={ resetIcon }
					onClick={ onReset }
				/>
			) }
			<DropZone onFilesDrop={ onFilesDrop } />
		</div>
	);
}
