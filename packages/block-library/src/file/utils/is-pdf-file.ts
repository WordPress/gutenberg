import { getFilename } from '@wordpress/url';

type FileDetails = {
	/**
	 * The file's mime type, if known.
	 */
	mimeType?: string | null;
	/**
	 * The file's URL.
	 */
	url?: string | null;
};

/**
 * Determines whether a file is a PDF.
 *
 * The mime type is checked first, since it is the most reliable source. When
 * it is not available, the file name in the URL is checked instead. Query
 * strings and hash fragments are ignored, so signed or versioned URLs such as
 * `report.pdf?signature=abc` are still detected.
 *
 * @param file          File details.
 * @param file.mimeType The file's mime type, if known.
 * @param file.url      The file's URL.
 * @return Whether the file is a PDF.
 */
export function isPdfFile( { mimeType, url }: FileDetails = {} ): boolean {
	if ( mimeType === 'application/pdf' ) {
		return true;
	}

	if ( ! url ) {
		return false;
	}

	return !! getFilename( url )?.toLowerCase().endsWith( '.pdf' );
}
