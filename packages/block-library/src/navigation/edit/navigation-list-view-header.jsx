import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';
import useNavigationMenu from '../use-navigation-menu';
import NavigationDraftBadge from './navigation-draft-badge';

const { useBlockDisplayTitle } = unlock( blockEditorPrivateApis );

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );

export default function NavigationListViewHeader( {
	clientId,
	blockEditingMode,
	currentMenuId,
	onSelectClassicMenu,
	onSelectNavigationMenu,
	onCreateNew,
	isManageMenusButtonDisabled,
} ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );

	const { navigationMenu } = useNavigationMenu( currentMenuId );
	const isDraft = navigationMenu?.status === 'draft';

	return (
		<HStack className="wp-block-navigation-off-canvas-editor__header">
			<HStack alignment="left" spacing={ 2 }>
				<Heading
					className="wp-block-navigation-off-canvas-editor__title"
					level={ 2 }
				>
					{ blockTitle }
				</Heading>
				{ isDraft && <NavigationDraftBadge /> }
			</HStack>
			{ blockEditingMode === 'default' && (
				<NavigationMenuSelector
					currentMenuId={ currentMenuId }
					onSelectClassicMenu={ onSelectClassicMenu }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					onCreateNew={ onCreateNew }
					actionLabel={ actionLabel }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
				/>
			) }
		</HStack>
	);
}
