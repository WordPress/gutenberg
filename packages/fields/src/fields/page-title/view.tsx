import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Settings } from '@wordpress/core-data';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import type { CommonPost } from '../../types';
import { BaseTitleView } from '../title/view';
import { unlock } from '../../lock-unlock';
const { Badge: WCBadge } = unlock( componentsPrivateApis );

export default function PageTitleView( { item }: { item: CommonPost } ) {
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
		<BaseTitleView item={ item } className="fields-field__page-title">
			{ badge && <WCBadge>{ badge }</WCBadge> }
		</BaseTitleView>
	);
}
