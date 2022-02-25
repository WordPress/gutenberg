/**
 * WordPress dependencies
 */
import { Placeholder, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */

import useNavigationEntities from '../../use-navigation-entities';
import PlaceholderPreview from './placeholder-preview';
import useCreateNavigationMenu from '../use-create-navigation-menu';
import NavigationMenuSelector from '../navigation-menu-selector';

export default function NavigationPlaceholder( {
	currentMenuId,
	clientId,
	onFinish,
	hasResolvedNavigationMenus,
	canUserCreateNavigationMenu = false,
} ) {
	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		if ( ! canUserCreateNavigationMenu ) {
			return;
		}

		const navigationMenu = await createNavigationMenu(
			navigationMenuTitle,
			blocks
		);
		onFinish( navigationMenu, blocks );
	};

	const { isResolvingPages, isResolvingMenus } = useNavigationEntities();

	const isStillLoading = isResolvingPages || isResolvingMenus;

	const onCreateEmptyMenu = () => {
		onFinishMenuCreation( [] );
	};

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

							<NavigationMenuSelector
								currentMenuId={ currentMenuId }
								clientId={ clientId }
								onSelect={ onFinish }
								toggleProps={ {
									variant: 'tertiary',
									iconPosition: 'right',
									className:
										'wp-block-navigation-placeholder__actions__dropdown',
								} }
							/>

							<hr />

							{ canUserCreateNavigationMenu && (
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
