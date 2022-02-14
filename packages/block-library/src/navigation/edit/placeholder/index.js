/**
 * WordPress dependencies
 */
import { Placeholder, Button, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */

import useNavigationEntities from '../../use-navigation-entities';
import PlaceholderPreview from './placeholder-preview';
import useNavigationMenu from '../../use-navigation-menu';
import useCreateNavigationMenu from '../use-create-navigation-menu';
import NavigationMenuSelector from '../navigation-menu-selector';

export default function NavigationPlaceholder( {
	clientId,
	onFinish,
	canSwitchNavigationMenu,
	hasResolvedNavigationMenus,
	canUserCreateNavigation = false,
} ) {
	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		if ( ! canUserCreateNavigation ) {
			return;
		}

		const navigationMenu = await createNavigationMenu(
			navigationMenuTitle,
			blocks
		);
		onFinish( navigationMenu, blocks );
	};

	const {
		isResolvingPages,
		isResolvingMenus,
		hasMenus,
	} = useNavigationEntities();

	const isStillLoading = isResolvingPages || isResolvingMenus;

	const onCreateEmptyMenu = () => {
		onFinishMenuCreation( [] );
	};

	const { navigationMenus } = useNavigationMenu();

	const hasNavigationMenus = !! navigationMenus?.length;

	const showSelectMenus =
		( canSwitchNavigationMenu || canUserCreateNavigation ) &&
		( hasNavigationMenus || hasMenus );

	return (
		<>
			{ ( ! hasResolvedNavigationMenus || isStillLoading ) && (
				<PlaceholderPreview isLoading />
			) }
			{ hasResolvedNavigationMenus && ! isStillLoading && (
				<Placeholder className="wp-block-navigation-placeholder">
					<PlaceholderPreview />
					<div className="wp-block-navigation-placeholder__controls">
						<div className="wp-block-navigation-placeholder__actions">
							<div className="wp-block-navigation-placeholder__actions__indicator">
								<Icon icon={ navigation } />{ ' ' }
								{ __( 'Navigation' ) }
							</div>

							<hr />

							{ showSelectMenus ? (
								<>
									<DropdownMenu
										text={ __( 'Select menu' ) }
										icon={ null }
										toggleProps={ {
											variant: 'tertiary',
											iconPosition: 'right',
											className:
												'wp-block-navigation-placeholder__actions__dropdown',
										} }
										popoverProps={ { isAlternate: true } }
									>
										{ () => (
											<NavigationMenuSelector
												clientId={ clientId }
												onSelect={ onFinish }
											/>
										) }
									</DropdownMenu>
									<hr />
								</>
							) : undefined }

							{ canUserCreateNavigation && (
								<Button
									variant="tertiary"
									onClick={ onCreateEmptyMenu }
								>
									{ __( 'Start empty' ) }
								</Button>
							) }
						</div>
					</div>
				</Placeholder>
			) }
		</>
	);
}
