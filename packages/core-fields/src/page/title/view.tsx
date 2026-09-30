import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Settings } from '@wordpress/core-data';
import { Badge } from '@wordpress/ui';
import { BaseTitleView } from '../../shared/title/view';
import type { ItemWithTitle } from '../../shared/title/get-item-title';

/*
 * A copy of the page title view of `@wordpress/fields`.
 */
export default function PageTitleView( {
	item,
}: {
	item: ItemWithTitle & { id?: number };
} ) {
	const { frontPageId, postsPageId, privacyPolicyPageId } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord(
				'root',
				'site'
			) as Partial< Settings >;
			return {
				frontPageId: siteSettings?.page_on_front,
				postsPageId: siteSettings?.page_for_posts,
				privacyPolicyPageId: siteSettings?.page_for_privacy_policy,
			};
		},
		[]
	);
	let badge;
	if ( item.id === frontPageId ) {
		badge = __( 'Homepage' );
	} else if ( item.id === postsPageId ) {
		badge = __( 'Posts Page' );
	} else if ( item.id === privacyPolicyPageId ) {
		badge = __( 'Privacy Policy Page' );
	}
	return (
		<BaseTitleView item={ item }>
			{ badge && <Badge>{ badge }</Badge> }
		</BaseTitleView>
	);
}
