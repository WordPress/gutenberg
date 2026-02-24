/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useEntityRecord } from '@wordpress/core-data';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import NavigationMenuEditor from './navigation-menu-editor';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';

const { useLocation } = unlock( routerPrivateApis );

export default function NavigationMenuDetail() {
	const {
		params: { postId },
	} = useLocation();

	const { record: navigationMenu, isResolving } = useEntityRecord(
		'postType',
		'wp_navigation',
		postId
	);

	const title = buildNavigationLabel(
		navigationMenu?.title,
		navigationMenu?.id,
		navigationMenu?.status
	);

	if ( isResolving ) {
		return (
			<Page title={ __( 'Navigation Menu' ) }>
				<Spinner />
			</Page>
		);
	}

	return (
		<Page
			title={ title || __( 'Navigation Menu' ) }
			subTitle={ __(
				'Navigation Menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
		>
			<NavigationMenuEditor
				navigationMenuId={ parseInt( postId ) }
				hasDarkBackground={ false }
			/>
		</Page>
	);
}
