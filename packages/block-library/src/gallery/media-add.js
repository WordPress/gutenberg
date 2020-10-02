/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	Dropdown,
	FormFileUpload,
	MenuItem,
	NavigableMenu,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { media as mediaIcon, upload } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

export default function MediaAddButton( {
	allowedTypes,
	images,
	onError,
	onSelect,
	value
} ) {

	const mediaUpload = useSelect(
		( select ) => select( 'core/block-editor' ).getSettings().mediaUpload,
		[]
	);

	const onKeyDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			event.target.click();
		}
	};

	const mediaLibraryButton = ( { open } ) => (
		<MenuItem icon={ mediaIcon } onClick={ open }>
			{ __( 'Open Media Library' ) }
		</MenuItem>
	);

	const mediaUploadButton = ( { openFileDialog } ) => (
		<MenuItem icon={ upload } onClick={ openFileDialog }>
			{ __( 'Upload' ) }
		</MenuItem>
	);

	const onFileUpload = ( event, onClose ) => {
		// Since the setMedia function runs multiple times per upload group
		// and is passed newMedia containing every item in its group each time, we must
		// filter out whatever this upload group had previously returned to the
		// gallery before adding and returning the image array with replacement newMedia
		// values.

		// Define an array to store urls from newMedia between subsequent function calls.
		let lastMediaPassed = [];
		const setMedia = ( newMedia ) => {
			// Remove any images this upload group is responsible for (lastMediaPassed).
			// Their replacements are contained in newMedia.
			const filteredMedia = ( images ?? [] ).filter( ( item ) => {
				// If Item has id, only remove it if lastMediaPassed has an item with that id.
				if ( item.id ) {
					return ! lastMediaPassed.some(
						// Be sure to convert to number for comparison.
						( { id } ) => Number( id ) === Number( item.id )
					);
				}

				// Compare transient images via .includes since gallery may append extra info onto the url.
				return ! lastMediaPassed.some( ( { urlSlug } ) =>
					item.url.includes( urlSlug )
				);
			} );

			// Return the filtered media array along with newMedia.
			onSelect( filteredMedia.concat( newMedia ) );

			// Reset lastMediaPassed and set it with ids and urls from newMedia.
			lastMediaPassed = newMedia.map( ( media ) => {
				// Add everything up to '.fileType' to compare via .includes.
				const cutOffIndex = media.url.lastIndexOf( '.' );
				const urlSlug = media.url.slice( 0, cutOffIndex );

				return {
					id: media.id,
					urlSlug,
				};
			} );
		};

		mediaUpload( {
			allowedTypes,
			filesList: event.target.files,
			onFileChange: setMedia,
			onError,
		} );

		onClose();
	};

	const dropdownToggle = ( { isOpen, onToggle } ) => (
		<ToolbarGroup className="media-add">
			<ToolbarButton
				ref={ createRef() }
				aria-expanded={ isOpen }
				aria-haspopup="true"
				onClick={ onToggle }
				onKeyDown={ onKeyDown }
			>
				{ __( 'Add image' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);

	const dropdownContent = ( { onClose } ) => (
		<NavigableMenu className="block-editor-media-add__media-upload-menu">
			<MediaUpload
				multiple
				gallery
				addToGallery
				title={ __( 'Add image' ) }
				onSelect={ onSelect }
				onError={ onError }
				allowedTypes={ allowedTypes }
				value={ value }
				render={ mediaLibraryButton }
			/>
			<MediaUploadCheck>
				<FormFileUpload
					onChange={ ( event ) => onFileUpload( event, onClose ) }
					accept={ allowedTypes }
					render={ mediaUploadButton }
				/>
			</MediaUploadCheck>
		</NavigableMenu>
	);

	return (
		<Dropdown
			popoverProps={ {
				isAlternate: true,
			} }
			contentClassName="block-editor-media-add__options"
			renderToggle={ dropdownToggle }
			renderContent={ dropdownContent }
		/>
	);
}
