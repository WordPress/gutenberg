/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import DownloadableBlockIcon from '../downloadable-block-icon';

function DownloadableBlockCompactListItem( { item } ) {
	const { icon, title, author } = item;

	return (
		<li className="block-directory-downloadable-block-compact-list-item">
			<DownloadableBlockIcon icon={ icon } title={ title } />

			<div className="block-directory-downloadable-block-compact-list-item__details">
				<div className="block-directory-downloadable-block-compact-list-item__title">
					{ title }
				</div>
				<div className="block-directory-downloadable-block-compact-list-item__author">
					{ /* translators: %s: Name of the block author. */
					sprintf( 'By %s', author ) }
				</div>
			</div>
		</li>
	);
}

export default DownloadableBlockCompactListItem;
