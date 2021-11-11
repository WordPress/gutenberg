/**
 * WordPress dependencies
 */
import { InterfaceSkeleton } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from './header';
import NavigationSidebar from '../navigation-sidebar';
import Table from './table';

export default function List( { templateType } ) {
	return (
		<InterfaceSkeleton
			className="edit-site-list"
			labels={ {
				drawer: __( 'Navigation Sidebar' ),
			} }
			header={ <Header templateType={ templateType } /> }
			drawer={
				<NavigationSidebar
					defaultIsOpen
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
