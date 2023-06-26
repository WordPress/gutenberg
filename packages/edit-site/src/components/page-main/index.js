/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import PageTemplates from '../page-templates';
import PageLibrary from '../page-library';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export default function PageMain() {
	const {
		params: { path },
	} = useLocation();

	if ( path === '/wp_template/all' ) {
		return <PageTemplates />;
	} else if ( path === '/library' ) {
		return <PageLibrary />;
	}

	return null;
}
