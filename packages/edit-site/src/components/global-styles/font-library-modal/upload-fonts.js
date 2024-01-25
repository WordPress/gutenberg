/**
 * WordPress dependencies
 */
import { __experimentalSpacer as Spacer } from '@wordpress/components';

/**
 * Internal dependencies
 */
import LocalFonts from './local-fonts';

function UploadFonts() {
	return (
		<>
			<Spacer margin={ 8 } />
			<LocalFonts />
		</>
	);
}

export default UploadFonts;
