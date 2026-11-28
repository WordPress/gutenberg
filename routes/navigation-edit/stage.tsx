import type { ComponentPropsWithoutRef } from 'react';
import { Link, useParams } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import NavigationMenuEditor from './editor';
import styles from './style.module.scss';

const NAVIGATION_POST_TYPE = 'wp_navigation';

/**
 * Renders `Page` links with the router, which takes the path as `to`.
 */
function RouterLink( {
	href,
	...props
}: ComponentPropsWithoutRef< 'a' > & { href: string } ) {
	return <Link to={ href } { ...props } />;
}

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
			headingLevel={ 2 }
			breadcrumbs={ [
				{
					label: __( 'Navigation' ),
					href: '/navigation/list',
				},
				{
					label: decodeEntities( menuTitle ),
				},
			] }
			components={ { link: RouterLink } }
		>
			<div className={ styles.content }>
				<NavigationMenuEditor id={ navigationId } />
			</div>
		</Page>
	);
}

export const stage = NavigationEditStage;
