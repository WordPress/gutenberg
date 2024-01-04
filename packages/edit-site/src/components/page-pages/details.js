/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
	ExternalLink,
} from '@wordpress/components';
import { safeDecodeURIComponent, filterURLForDisplay } from '@wordpress/url';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import PageDetails from '../sidebar-navigation-screen-page/page-details';

const Details = ( { item } ) => {
	const link = item?.link;
	const excerpt = item?.excerpt?.rendered;

	return (
		<VStack className="edit-site-page-pages__item-details">
			{ link && (
				<ExternalLink href={ item.link }>
					{ filterURLForDisplay(
						safeDecodeURIComponent( item.link )
					) }
				</ExternalLink>
			) }
			{ excerpt && (
				<Truncate numberOfLines={ 3 }>
					{ stripHTML( excerpt ) }
				</Truncate>
			) }
			<PageDetails id={ item.id } />
		</VStack>
	);
};

export default Details;
