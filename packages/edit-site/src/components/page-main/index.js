/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import PageMainTemplates from '../page-main-templates';
import PageMainLibrary from '../page-main-library';
import { unlock } from '../../private-apis';

const { useLocation } = unlock( routerPrivateApis );

export default function PageMain() {
	const {
		params: { path },
	} = useLocation();

	if ( path === '/wp_template/all' ) {
		return <PageMainTemplates />;
	} else if ( path === '/wp_template_part/all' ) {
		return <PageMainLibrary />;
	}

	return null;
}
