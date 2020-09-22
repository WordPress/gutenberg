/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { getBlockType, getBlockFromExample } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';

const NavigationPanel = () => {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );
	const [ activeMenu, setActiveMenu ] = useState( 'root' );
	const [ showPreview, setShowPreview ] = useState( false );

	return (
		<>
			<div style={ { position: 'relative', height: '100%' } }>
				<Navigation
					activeItem={ activeItem }
					activeMenu={ activeMenu }
					onActivateMenu={ setActiveMenu }
				>
					<NavigationMenu title="Home">
						<NavigationGroup title="Group 1">
							<NavigationItem
								item="item-preview"
								title="Hover to show preview"
								onMouseEnter={ () => setShowPreview( true ) }
								onMouseLeave={ () => setShowPreview( false ) }
							/>
							<NavigationItem
								badge="2"
								item="item-3"
								navigateToMenu="category"
								title="Category"
							/>
							<NavigationItem
								item="item-3-fetching-badge"
								navigateToMenu="category"
								title="Delayed badge"
							/>
							<NavigationItem
								item="item-pointing-non-existing-menu"
								title="Navigate to a non existing menu"
								navigateToMenu="non-existing-menu"
							/>
						</NavigationGroup>
						<NavigationGroup title="Group 2">
							<NavigationItem
								href="https://wordpress.org/"
								item="item-4"
								target="_blank"
								title="External link"
							/>
							<NavigationItem item="item-5">
								<a
									href="https://wordpress.org/"
									// Since we're not actually navigating pages, simulate it with on onClick
									onClick={ ( event ) => {
										event.preventDefault();
										setActiveItem( 'item-5' );
									} }
								>
									<img
										alt="WordPress Logo"
										src="https://s.w.org/style/images/about/WordPress-logotype-wmark-white.png"
										style={ { width: 50, height: 50 } }
									/>
								</a>
							</NavigationItem>
						</NavigationGroup>
					</NavigationMenu>

					<NavigationMenu
						backButtonLabel="Home"
						menu="category"
						parentMenu="root"
						title="Category"
					>
						<NavigationItem
							badge="1"
							item="child-1"
							title="Child 1"
							onClick={ () => setActiveItem( 'child-1' ) }
						/>
						<NavigationItem
							item="child-2"
							title="Child 2"
							onClick={ () => setActiveItem( 'child-2' ) }
						/>
						<NavigationItem
							navigateToMenu="nested-category"
							item="child-3"
							title="Nested Category"
						/>
						<NavigationItem
							navigateToMenu="custom-back"
							item="child-4"
							title="Custom back"
						/>
						<NavigationItem
							navigateToMenu="automatic-back"
							item="child-5"
							title="Automatic back"
						/>
					</NavigationMenu>

					<NavigationMenu
						backButtonLabel="Category"
						menu="nested-category"
						parentMenu="category"
						title="Nested Category"
					>
						<NavigationItem
							item="sub-child-1"
							title="Sub Child 1"
							onClick={ () => setActiveItem( 'sub-child-1' ) }
						/>
						<NavigationItem
							item="sub-child-2"
							title="Sub Child 2"
							onClick={ () => setActiveItem( 'sub-child-2' ) }
						/>
					</NavigationMenu>

					<NavigationMenu
						backButtonLabel="Custom back"
						menu="custom-back"
						parentMenu="category"
						title="Custom backButtonLabel"
					>
						<NavigationItem
							item="sub-2-child-1"
							title="Sub Child 1"
						/>
						<NavigationItem
							item="sub-2-child-2"
							title="Sub Child 2"
						/>
					</NavigationMenu>

					<NavigationMenu
						menu="automatic-back"
						parentMenu="category"
						title="Automatic backButtonLabel"
					>
						<NavigationItem
							item="sub-3-child-1"
							title="Sub Child 1"
						/>
						<NavigationItem
							item="sub-3-child-2"
							title="Sub Child 2"
						/>
					</NavigationMenu>
				</Navigation>

				{ showPreview && (
					<div className="edit-site-navigation-sidebar_preview">
						<BlockPreview
							blocks={ [
								getBlockFromExample(
									'core/paragraph',
									getBlockType( 'core/paragraph' ).example
								),
							] }
							viewportWidth={ 1200 }
						/>
					</div>
				) }
			</div>
		</>
	);
};

export default NavigationPanel;
