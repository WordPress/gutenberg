/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockDirectoryStore } from '../../store';

export const DownloadableBlockNotice = ( { block } ) => {
	const errorNotice = useSelect(
		( select ) =>
			select( blockDirectoryStore ).getErrorNoticeForBlock( block.id ),
		[ block ]
	);

	if ( ! errorNotice ) {
		return null;
	}

	return (
		<div className="block-directory-downloadable-block-notice">
			<div className="block-directory-downloadable-block-notice__content">
				{ errorNotice.message }
				{ errorNotice.isFatal
					? ' ' + __( 'Try reloading the page.' )
					: null }
			</div>
		</div>
	);
};

export default DownloadableBlockNotice;
