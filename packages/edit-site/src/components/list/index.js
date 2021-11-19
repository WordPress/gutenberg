/**
 * WordPress dependencies
 */
import { InterfaceSkeleton } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Header from './header';
import NavigationSidebar from '../navigation-sidebar';
import Table from './table';

export default function List( { templateType } ) {
	const isDesktopViewport = useViewportMatch( 'medium' );

	return (
		<InterfaceSkeleton
			className="edit-site-list"
			labels={ {
				drawer: __( 'Navigation Sidebar' ),
			} }
			header={ <Header templateType={ templateType } /> }
			drawer={
				<NavigationSidebar
					defaultIsOpen={ isDesktopViewport }
					activeTemplateType={ templateType }
				/>
			}
			content={
				<main className="edit-site-list-main">
					<Table templateType={ templateType } />
				</main>
			}
		/>
	);
}
