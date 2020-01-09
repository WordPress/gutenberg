/**
 * WordPress dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DownloadableBlockNotice = ( { block, isLoading, errorNotices, onRetry } ) => {
	if ( ! errorNotices[ block.id ] ) {
		return null;
	}
	return (
		<Notice status="error" isDismissible={ false } className="block-directory-downloadable-blocks-notice">
			<span key={ 'copy' }>{ __( 'Block previews can’t load.' ) }</span>
			<Button isSmall isPrimary isBusy={ isLoading } onClick={ onRetry.bind( this, block ) }>
				{ __( 'Retry' ) }
			</Button>
		</Notice>
	);
};

export default DownloadableBlockNotice;
