/**
 * WordPress dependencies
 */
import { __experimentalSpacer as Spacer } from '@wordpress/components';

/**
 * Internal dependencies
 */
import LocalFonts from './local-fonts';

function UploadFonts( { onUpload } ) {
	return (
		<>
			<Spacer margin={ 8 } />
			<LocalFonts onUpload={ onUpload } />
		</>
	);
}

export default UploadFonts;
