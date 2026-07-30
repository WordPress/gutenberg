/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';

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
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	isManageMenusButtonDisabled,
} ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );

	return (
		<HStack className="wp-block-navigation-off-canvas-editor__header">
			<Heading
				className="wp-block-navigation-off-canvas-editor__title"
				level={ 2 }
			>
				{ blockTitle }
			</Heading>
			{ blockEditingMode === 'default' && (
				<NavigationMenuSelector
					currentMenuId={ currentMenuId }
					onSelectClassicMenu={ onSelectClassicMenu }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					onCreateNew={ onCreateNew }
					createNavigationMenuIsSuccess={
						createNavigationMenuIsSuccess
					}
					createNavigationMenuIsError={ createNavigationMenuIsError }
					actionLabel={ actionLabel }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
				/>
			) }
		</HStack>
	);
}
