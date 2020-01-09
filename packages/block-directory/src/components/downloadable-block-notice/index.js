/**
 * WordPress dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DOWNLOAD_ERROR_NOTICE_ID } from '../../store/constants';

const DownloadableBlockNotice = ( { block, isLoading, errorNotices, install, download } ) => {
	if ( ! errorNotices[ block.id ] ) {
		return null;
	}

	let copy, callback;

	// A Failed install is the default error as its the first step
	copy = __( 'Block previews can\'t install.' );
	callback = () => {
		const onSuccess = () => {
			download( block );
		};

		install( block, onSuccess );
	};

	if ( errorNotices[ block.id ] === DOWNLOAD_ERROR_NOTICE_ID ) {
		copy = __( 'Block previews can\'t load.' );
		callback = () => {
			download( block );
		};
	}

	return (
		<Notice status="error" isDismissible={ false } className="block-directory-downloadable-blocks-notice">
			<span className="block-directory-downloadable-blocks-notice-content">
				{ copy }
			</span>
			<Button isSmall isPrimary isBusy={ isLoading } onClick={ callback }>
				{ __( 'Retry' ) }
			</Button>
		</Notice>
	);
};

export default DownloadableBlockNotice;
