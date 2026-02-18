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
import { useNavigationListViewContext } from './navigation-list-view-context';
import { unlock } from '../../lock-unlock';

const { useBlockDisplayTitle } = unlock( blockEditorPrivateApis );

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );

/**
 * Header component for the navigation list view panel.
 * Renders the block title and menu selector.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 * @return {Element} The header component.
 */
export default function NavigationListViewHeader( { clientId } ) {
	const {
		currentMenuId,
		blockEditingMode,
		createNavigationMenuIsSuccess,
		createNavigationMenuIsError,
		onSelectClassicMenu,
		onSelectNavigationMenu,
		onCreateNew,
	} = useNavigationListViewContext();

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
				/>
			) }
		</HStack>
	);
}
