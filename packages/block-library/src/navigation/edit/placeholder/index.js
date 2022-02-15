/**
 * WordPress dependencies
 */
import { Placeholder, Button, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation, Icon } from '@wordpress/icons';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */

import useNavigationEntities from '../../use-navigation-entities';
import PlaceholderPreview from './placeholder-preview';
import useNavigationMenu from '../../use-navigation-menu';
import useCreateNavigationMenu from '../use-create-navigation-menu';
import NavigationMenuSelector from '../navigation-menu-selector';
import useConvertClassicMenu from '../../use-convert-classic-menu';

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

	const {
		dispatch: convertClassicMenuToBlocks,
		blocks: classicMenuBlocks,
		name: classicMenuName,
		isResolving: isResolvingClassicMenuConversion,
		hasResolved: hasResolvedClassicMenuConversion,
	} = useConvertClassicMenu( () => {} );

	useEffect( () => {
		async function handleCreateNav() {
			const navigationMenuPost = await createNavigationMenu(
				classicMenuName,
				classicMenuBlocks
			);
			onFinish( navigationMenuPost, classicMenuBlocks );
		}
		if (
			hasResolvedClassicMenuConversion &&
			classicMenuName &&
			classicMenuBlocks?.length
		) {
			handleCreateNav();
		}
	}, [
		classicMenuBlocks,
		classicMenuName,
		hasResolvedClassicMenuConversion,
	] );

	const isStillLoading =
		isResolvingPages ||
		isResolvingMenus ||
		isResolvingClassicMenuConversion;

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
										{ ( { onClose } ) => (
											<NavigationMenuSelector
												clientId={ clientId }
												onSelect={ onFinish }
												onSelectClassicMenu={ (
													menu
												) => {
													onClose();
													convertClassicMenuToBlocks(
														menu?.id,
														menu?.name
													);
												} }
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
