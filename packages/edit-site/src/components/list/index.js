/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from './header';
import Table from './table';
import Layout from '../layout';

function List() {
	return <Table />;
}

List.renderLayout = function renderListLayout( {
	postType,
	activeTemplateType,
} ) {
	// `postType` could load in asynchronously. Only provide the detailed region labels if
	// the postType has loaded, otherwise `InterfaceSkeleton` will fallback to the defaults.
	const itemsListLabel = postType?.labels?.items_list;
	const detailedRegionLabels = postType
		? {
				header: sprintf(
					// translators: %s - the name of the page, 'Header' as in the header area of that page.
					__( '%s - Header' ),
					itemsListLabel
				),
				body: sprintf(
					// translators: %s - the name of the page, 'Content' as in the content area of that page.
					__( '%s - Content' ),
					itemsListLabel
				),
		  }
		: undefined;

	return (
		<Layout
			isNavigationDefaultOpen
			activeTemplateType={ activeTemplateType }
			className="edit-site-list"
			labels={ {
				drawer: __( 'Navigation Sidebar' ),
				...detailedRegionLabels,
			} }
			header={ <Header /> }
			content={ <List /> }
		/>
	);
};

export default List;
