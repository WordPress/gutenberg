/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import PagePatterns from '../page-patterns';
import PageTemplateParts from '../page-template-parts';
import PageTemplates from '../page-templates';
import DataviewsTemplates from '../page-templates/dataviews-templates';
import PagePages from '../page-pages';
import PageMedia from '../page-media';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export default function PageMain() {
	const {
		params: { path },
	} = useLocation();

	if ( path === '/media/all' ) {
		return <PageMedia />;
	}

	if ( path === '/wp_template/all' ) {
		return window?.__experimentalAdminViews ? (
			<DataviewsTemplates />
		) : (
			<PageTemplates />
		);
	}

	if ( path === '/wp_template_part/all' ) {
		return <PageTemplateParts />;
	}

	if ( path === '/patterns' ) {
		return <PagePatterns />;
	}

	if ( window?.__experimentalAdminViews && path === '/pages' ) {
		return <PagePages />;
	}

	return null;
}
