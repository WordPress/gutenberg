/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil, blockDefault, tool, upload } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function GuidelinesCategories() {
	const { query } = useLocation();
	const currentSection = query.section || 'library';

	const items = [
		{
			id: 'library',
			label: __( 'Library' ),
			icon: pencil,
		},
		{
			id: 'blocks',
			label: __( 'Blocks' ),
			icon: blockDefault,
		},
		{
			id: 'playground',
			label: __( 'Playground' ),
			icon: tool,
		},
		{
			id: 'import-export',
			label: __( 'Import / Export' ),
			icon: upload,
		},
	];

	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-guidelines__group">
			{ items.map( ( item ) => (
				<SidebarNavigationItem
					key={ item.id }
					uid={ `guidelines-${ item.id }` }
					to={ `/guidelines?section=${ item.id }` }
					icon={ item.icon }
					aria-current={
						currentSection === item.id ? 'true' : undefined
					}
				>
					{ item.label }
				</SidebarNavigationItem>
			) ) }
		</ItemGroup>
	);
}

export default function SidebarNavigationScreenGuidelines( { backPath } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Guidelines' ) }
			description={ __(
				"Define your site's editorial voice and tone. While styles control how your site looks, guidelines control how it sounds."
			) }
			backPath={ backPath }
			content={ <GuidelinesCategories /> }
		/>
	);
}
