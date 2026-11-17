import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

type RevisionLinks = {
	'predecessor-version'?: Array< { id: number } >;
	'version-history'?: Array< { count: number } >;
};

type NavigateToEntityRecord = ( params: {
	postId: number;
	postType: string;
	revisionId?: number;
} ) => void;

type Props = {
	menuId: number;
	onNavigateToEntityRecord?: NavigateToEntityRecord;
};

/**
 * Opens the revisions of a Navigation Menu.
 *
 * Editors that can switch to another entity open the menu on its latest
 * revision. Anywhere else the button links to the revisions screen in the
 * admin.
 *
 * @param props                          Component props.
 * @param props.menuId                   ID of the `wp_navigation` post.
 * @param props.onNavigateToEntityRecord Editor setting that opens another entity.
 */
export default function NavigationMenuRevisionsButton( {
	menuId,
	onNavigateToEntityRecord,
}: Props ) {
	const { lastRevisionId, revisionsCount } = useSelect(
		( select ) => {
			const record = select( coreStore ).getEntityRecord(
				'postType',
				'wp_navigation',
				menuId
			) as { _links?: RevisionLinks } | undefined;
			const links = record?._links;
			return {
				lastRevisionId:
					links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null,
				revisionsCount: links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0,
			};
		},
		[ menuId ]
	);

	// A single revision has nothing to compare against.
	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}
	const revisionId: number = lastRevisionId;

	const actionProps = onNavigateToEntityRecord
		? {
				onClick: () =>
					onNavigateToEntityRecord( {
						postId: menuId,
						postType: 'wp_navigation',
						revisionId,
					} ),
			}
		: {
				href: addQueryArgs( 'revision.php', {
					revision: revisionId,
				} ),
			};

	return (
		<Button
			__next40pxDefaultSize
			className="wp-block-navigation-revisions-button"
			variant="secondary"
			{ ...actionProps }
		>
			{ __( 'View revisions' ) }
		</Button>
	);
}
