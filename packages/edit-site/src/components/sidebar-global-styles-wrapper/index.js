/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import GlobalStylesUI from '../global-styles/ui';
import Page from '../page';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const GLOBAL_STYLES_PATH_PREFIX = '/wp_global_styles';

export default function GlobalStylesUIWrapper() {
	const { params } = useLocation();
	const history = useHistory();
	const pathWithPrefix = params.path;
	const [ path, onPathChange ] = useMemo( () => {
		const processedPath = pathWithPrefix.substring(
			GLOBAL_STYLES_PATH_PREFIX.length
		);
		return [
			processedPath ? processedPath : '/',
			( newPath ) => {
				history.push( {
					path:
						! newPath || newPath === '/'
							? GLOBAL_STYLES_PATH_PREFIX
							: `${ GLOBAL_STYLES_PATH_PREFIX }${ newPath }`,
				} );
			},
		];
	}, [ pathWithPrefix, history ] );
	return (
		<Page className="edit-site-styes" title={ __( 'Styles' ) }>
			<GlobalStylesUI path={ path } onPathChange={ onPathChange } />
		</Page>
	);
}
