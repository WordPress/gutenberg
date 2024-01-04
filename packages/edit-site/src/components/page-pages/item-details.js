/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	ExternalLink,
} from '@wordpress/components';
import { safeDecodeURIComponent, filterURLForDisplay } from '@wordpress/url';

const ItemDetails = ( { item } ) => {
	return (
		<VStack
			className={ classnames(
				'edit-site-sidebar-navigation-screen__main'
			) }
			spacing={ 0 }
			justify="flex-start"
		>
			<div className="edit-site-sidebar-navigation-screen__meta">
				<ExternalLink
					className="edit-site-sidebar-navigation-screen__page-link"
					href={ item.link }
				>
					{ filterURLForDisplay(
						safeDecodeURIComponent( item.link )
					) }
				</ExternalLink>
			</div>

			<div className="edit-site-sidebar-navigation-screen__content">
				{ 'content goes here ' }
			</div>
		</VStack>
	);
};

export default ItemDetails;
