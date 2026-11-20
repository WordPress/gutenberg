import { getFilename } from '@wordpress/url';

/**
 * Whether a URL points to a PDF file, going by the file name in its path.
 * The query string and fragment are ignored, so a signed URL such as
 * `file.pdf?signature=abc` still counts.
 *
 * @param url The URL to check.
 * @return Whether the URL's file name has a `.pdf` extension.
 */
export function isPdfUrl( url?: string ): boolean {
	return !! url && !! getFilename( url )?.toLowerCase().endsWith( '.pdf' );
}
