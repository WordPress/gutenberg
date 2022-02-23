/**
 * WordPress dependencies
 */
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation, Icon } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationEntities from '../../use-navigation-entities';
import PlaceholderPreview from './placeholder-preview';
import useCreateNavigationMenu from '../use-create-navigation-menu';
import NavigationMenuSelector from '../navigation-menu-selector';

export default function NavigationPlaceholder( {
	isSelected,
	currentMenuId,
	clientId,
	canUserCreateNavigationMenu = false,
	isResolvingCanUserCreateNavigationMenu,
	onFinish,
} ) {
	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		const navigationMenu = await createNavigationMenu(
			navigationMenuTitle,
			blocks
		);
		onFinish( navigationMenu, blocks );
	};

	const { isResolvingMenus, hasResolvedMenus } = useNavigationEntities();

	const onCreateEmptyMenu = () => {
		onFinishMenuCreation( [] );
	};

	useEffect( () => {
		if ( ! isSelected ) {
			return;
		}

		if ( isResolvingMenus ) {
			speak(
				__( 'Loading Navigation block setup placeholder options.' ),
				'polite'
			);
		}

		if ( hasResolvedMenus ) {
			speak(
				__( 'Navigation block setup placeholder options ready.' ),
				'polite'
			);
		}
	}, [ isResolvingMenus, isSelected ] );

	const isResolvingActions =
		isResolvingMenus && isResolvingCanUserCreateNavigationMenu;

	return (
		<>
			<Placeholder className="wp-block-navigation-placeholder">
				{
					// The <PlaceholderPreview> component is displayed conditionally via CSS depending on
					// whether the block is selected or not. This is achieved via CSS to avoid
					// component re-renders
				 }
				<PlaceholderPreview isVisible={ ! isSelected } />
				<div
					aria-hidden={ ! isSelected }
					className="wp-block-navigation-placeholder__controls"
				>
					<div className="wp-block-navigation-placeholder__actions">
						<div className="wp-block-navigation-placeholder__actions__indicator">
							<Icon icon={ navigation } /> { __( 'Navigation' ) }
						</div>

						<hr />

						{ isResolvingActions && <Spinner /> }

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
		</>
	);
}
