import { useParams } from '@wordpress/route';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import NavigationMenuEditor from './editor';
import styles from './style.module.scss';

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
				),
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
			ariaLabel={ decodeEntities( menuTitle ) }
			headingLevel={ 2 }
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
		>
			<div className={ styles.content }>
				<NavigationMenuEditor id={ navigationId } />
			</div>
		</Page>
	);
}

export const stage = NavigationEditStage;
