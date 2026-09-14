import { createBlobURL } from '@wordpress/blob';
import { createBlock, type Block } from '@wordpress/blocks';
import { _x } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';

/**
 * A file chosen from the Media Library.
 */
export type MediaItem = {
	id: number;
	url: string;
	title?: string;
	// The Media Library and the REST API use different properties for the
	// MIME type.
	mime?: string;
	mime_type?: string;
};

/**
 * Whether a file is a PDF, judged by its MIME type or its file name.
 *
 * @param mimeType The file's MIME type.
 * @param url      The file's URL or name.
 * @return Whether the file is a PDF.
 */
export function isPdf( mimeType?: string, url?: string ): boolean {
	return (
		mimeType === 'application/pdf' ||
		!! getFilename( url ?? '' )
			?.toLowerCase()
			.endsWith( '.pdf' )
	);
}

/**
 * Creates a File block for each selected file.
 *
 * Local files aren't uploaded yet, so each block gets a blob URL and uploads
 * its own file once it mounts. Media Library items are already uploaded, so
 * their details are set directly.
 *
 * Inline PDF embeds start turned off: an embed on every row doesn't suit a
 * list of files.
 *
 * @param selection Local files, or items chosen from the Media Library.
 * @return File blocks.
 */
export function createFileBlocks(
	selection: ArrayLike< File | MediaItem >
): Block[] {
	// Blocks created here bypass the default variation, so set the localized
	// button text here.
	const downloadButtonText = _x( 'Download', 'button label' );

	return Array.from( selection ).map( ( item ) => {
		if ( item instanceof window.File ) {
			return createBlock( 'core/file', {
				blob: createBlobURL( item ),
				fileName: item.name,
				downloadButtonText,
				displayPreview: isPdf( item.type, item.name )
					? false
					: undefined,
			} );
		}

		const block = createBlock( 'core/file', {
			href: item.url,
			fileName: item.title,
			textLinkHref: item.url,
			id: item.id,
			downloadButtonText,
			displayPreview: isPdf( item.mime || item.mime_type, item.url )
				? false
				: undefined,
		} );
		// Uploaded files get this ID from the File block itself, which knows
		// its client ID. Here the block is created before it's inserted.
		block.attributes.fileId = `wp-block-file--media-${ block.clientId }`;

		return block;
	} );
}
