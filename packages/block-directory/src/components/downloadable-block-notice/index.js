/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockDirectoryStore } from '../../store';

export const DownloadableBlockNotice = ( { block, onClick } ) => {
	const errorNotice = useSelect(
		( select ) =>
			select( blockDirectoryStore ).getErrorNoticeForBlock( block.id ),
		[ block ]
	);

	if ( ! errorNotice ) {
		return null;
	}

	return (
		<Notice
			status="error"
			isDismissible={ false }
			className="block-directory-downloadable-block-notice"
		>
			<div className="block-directory-downloadable-block-notice__content">
				{ errorNotice.message }
			</div>
			<Button
				isSmall
				isPrimary
				onClick={ () => {
					if ( errorNotice.isFatal ) {
						window.location.reload();
						return false;
					}

					onClick( block );
				} }
			>
				{ errorNotice.isFatal ? __( 'Reload' ) : __( 'Retry' ) }
			</Button>
		</Notice>
	);
};

export default DownloadableBlockNotice;
