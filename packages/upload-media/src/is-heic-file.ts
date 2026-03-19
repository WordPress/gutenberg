/**
 * Checks whether a file is HEIC or HEIF format.
 *
 * @param file The file to check.
 * @return True if the file is HEIC/HEIF.
 */
export function isHeicFile( file: File ): boolean {
	const heicTypes = [ 'image/heic', 'image/heif' ];
	if ( heicTypes.includes( file.type ) ) {
		return true;
	}
	// Some browsers don't set the MIME type for HEIC files.
	const ext = file.name.split( '.' ).pop()?.toLowerCase();
	return ext === 'heic' || ext === 'heif';
}
