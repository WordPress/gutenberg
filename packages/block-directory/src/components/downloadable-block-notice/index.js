/**
 * WordPress dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DOWNLOAD_ERROR_NOTICE_ID } from '../../store/constants';

const DownloadableBlockNotice = ( { block, errorNotices, onClick } ) => {
	if ( ! errorNotices[ block.id ] ) {
		return null;
	}

	// A Failed install is the default error as its the first step
	let copy = __( 'Block could not be added.' );

	if ( errorNotices[ block.id ] === DOWNLOAD_ERROR_NOTICE_ID ) {
		copy = __(
			'Block could not be added. There is a problem with the block.'
		);
	}

	return (
		<Notice
			status="error"
			isDismissible={ false }
			className="block-directory-downloadable-blocks__notice"
		>
			<div className="block-directory-downloadable-blocks__notice-content">
				{ copy }
			</div>
			<Button
				isSmall
				isPrimary
				onClick={ () => {
					onClick( block );
				} }
			>
				{ __( 'Retry' ) }
			</Button>
		</Notice>
	);
};

export default DownloadableBlockNotice;
