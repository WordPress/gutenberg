/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
				{ errorNotice.isFatal &&
					sprintf(
						/* translators: %s: Error message. */
						__( '%s Try reloading the page.' ),
						errorNotice.message
					) }
				{ ! errorNotice.isFatal && errorNotice.message }
			</div>
		</div>
	);
};

export default DownloadableBlockNotice;
