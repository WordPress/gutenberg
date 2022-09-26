/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DownloadableBlockIcon from '../downloadable-block-icon';

export default function CompactList( { items } ) {
	if ( ! items.length ) {
		return null;
	}

	return (
		<ul className="block-directory-compact-list">
			{ items.map( ( { icon, id, title, author } ) => (
				<li key={ id } className="block-directory-compact-list__item">
					<DownloadableBlockIcon icon={ icon } title={ title } />

					<div className="block-directory-compact-list__item-details">
						<div className="block-directory-compact-list__item-title">
							{ title }
						</div>
						<div className="block-directory-compact-list__item-author">
							{ sprintf(
								/* translators: %s: Name of the block author. */
								__( 'By %s' ),
								author
							) }
						</div>
					</div>
				</li>
			) ) }
		</ul>
	);
}
