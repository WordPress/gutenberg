/**
 * WordPress dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DOWNLOAD_ERROR_NOTICE_ID } from '../../store/constants';

const DownloadableBlockNotice = ( { block, errorNotices, fullInstall, download } ) => {
	if ( ! errorNotices[ block.id ] ) {
		return null;
	}

	// A Failed install is the default error as its the first step
	let copy = __( 'Block previews can\'t install.' );
	let callback = fullInstall;

	if ( errorNotices[ block.id ] === DOWNLOAD_ERROR_NOTICE_ID ) {
		copy = __( 'Block previews can\'t load.' );
		callback = download;
	}

	return (
		<Notice status="error" isDismissible={ false } className="block-directory-downloadable-blocks-notice">
			<span className="block-directory-downloadable-blocks-notice-content">
				{ copy }
			</span>
			<Button isSmall isPrimary onClick={ () => {
				callback( block );
			} }>
				{ __( 'Retry' ) }
			</Button>
		</Notice>
	);
};

export default DownloadableBlockNotice;
