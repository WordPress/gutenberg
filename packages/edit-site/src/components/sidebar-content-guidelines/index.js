/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useViewportMatch } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ContentGuidelinesUI from './content-guidelines-ui';

const { useLocation, useHistory } = unlock( routerPrivateApis );

/**
 * Hook to deal with navigation and location state.
 *
 * @return {Array} The current section and a function to update it.
 */
export const useSection = () => {
	const { path, query } = useLocation();
	const history = useHistory();
	return useMemo( () => {
		return [
			query.section ?? '/',
			( updatedSection ) => {
				history.navigate(
					addQueryArgs( path, {
						section: updatedSection,
					} )
				);
			},
		];
	}, [ path, query.section, history ] );
};

export default function SidebarContentGuidelines() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ section, onChangeSection ] = useSection();

	return (
		<Page
			className="edit-site-guidelines"
			title={ __( 'Guidelines' ) }
		>
			<ContentGuidelinesUI
				path={ section }
				onPathChange={ onChangeSection }
			/>
		</Page>
	);
}
