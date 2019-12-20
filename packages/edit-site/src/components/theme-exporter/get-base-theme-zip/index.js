/**
 * External dependencies
 */
import JSZip from 'jszip';

/**
 * Internal dependencies
 */
import content from './content';

export default function getBaseThemeZip() {
	const zip = new JSZip();
	Object.entries( content ).forEach( ( [ fileName, fileContent ] ) =>
		zip.file( fileName, fileContent )
	);
	return zip;
}
