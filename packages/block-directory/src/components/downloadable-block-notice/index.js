/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { DOWNLOAD_ERROR_NOTICE_ID } from '../../store/constants';

export const DownloadableBlockNotice = ( { block, errorNotices, onClick } ) => {
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

export default withSelect( ( select ) => {
	return {
		errorNotices: select( 'core/block-directory' ).getErrorNotices(),
	};
} )( DownloadableBlockNotice );
