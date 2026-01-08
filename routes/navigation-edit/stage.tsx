/**
 * WordPress dependencies
 */
import { useParams } from '@wordpress/route';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import type { Post } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from './editor';

const NAVIGATION_POST_TYPE = 'wp_navigation';

function NavigationEditStage() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigationId = parseInt( id );
	const { navigationMenu } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			return {
				navigationMenu: getEntityRecord(
					'postType',
					NAVIGATION_POST_TYPE,
					navigationId
				) as Post,
			};
		},
		[ navigationId ]
	);

	if ( ! navigationMenu ) {
		return;
	}

	const menuTitle =
		navigationMenu.title?.rendered || navigationMenu.title?.raw || '';

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Navigation' ),
							to: '/navigation/list',
						},
						{
							label: decodeEntities( menuTitle ),
						},
					] }
				/>
			}
			hasPadding
		>
			<NavigationMenuEditor id={ navigationId } />
		</Page>
	);
}

export const stage = NavigationEditStage;
