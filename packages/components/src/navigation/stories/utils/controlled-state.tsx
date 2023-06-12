/**
 * External dependencies
 */
import type { ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../button';
import { Navigation } from '../..';
import { NavigationItem } from '../../item';
import { NavigationMenu } from '../../menu';

export const ControlledStateStory: ComponentStory< typeof Navigation > = ( {
	className,
	...props
} ) => {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );
	const [ activeMenu, setActiveMenu ] = useState( 'root' );

	// Mock navigation link.
	const MockLink = ( {
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	} ) => (
		<Button
			href={ href }
			// Since we're not actually navigating pages, simulate it with onClick.
			onClick={
				( ( event ) => {
					event.preventDefault();
					const item = href.replace( 'https://example.com/', '' );
					setActiveItem( item );
				} ) as React.MouseEventHandler< HTMLAnchorElement >
			}
		>
			{ children }
		</Button>
	);

	return (
		<>
			<Navigation
				{ ...props }
				activeItem={ activeItem }
				activeMenu={ activeMenu }
				className={ [ 'navigation-story', className ]
					.filter( Boolean )
					.join( ' ' ) }
				onActivateMenu={ setActiveMenu }
			>
				<NavigationMenu title="Home">
					<NavigationItem item="item-1" title="Item 1">
						<MockLink href="https://example.com/item-1">
							Item 1
						</MockLink>
					</NavigationItem>
					<NavigationItem item="item-2">
						<MockLink href="https://example.com/item-2">
							Item 2
						</MockLink>
					</NavigationItem>
					<NavigationItem
						item="item-sub-menu"
						navigateToMenu="sub-menu"
						title="Sub-Menu"
					/>
				</NavigationMenu>
				<NavigationMenu
					menu="sub-menu"
					parentMenu="root"
					title="Sub-Menu"
				>
					<NavigationItem
						item="child-1"
						onClick={ () => setActiveItem( 'child-1' ) }
						title="Child 1"
					/>
					<NavigationItem
						item="child-2"
						onClick={ () => setActiveItem( 'child-2' ) }
						title="Child 2"
					/>
					<NavigationItem
						item="child-nested-sub-menu"
						navigateToMenu="nested-sub-menu"
						title="Nested Sub-Menu"
					/>
				</NavigationMenu>
				<NavigationMenu
					menu="nested-sub-menu"
					parentMenu="sub-menu"
					title="Nested Sub-Menu"
				>
					<NavigationItem
						item="sub-child-1"
						onClick={ () => setActiveItem( 'sub-child-1' ) }
						title="Sub-Child 1"
					/>
					<NavigationItem
						item="sub-child-2"
						onClick={ () => setActiveItem( 'sub-child-2' ) }
						title="Sub-Child 2"
					/>
				</NavigationMenu>
			</Navigation>

			<div className="navigation-story__aside">
				<p>
					Menu <code>{ activeMenu }</code> is active.
					<br />
					Item <code>{ activeItem }</code> is active.
				</p>
				<p>
					<Button
						variant="secondary"
						onClick={ () => {
							setActiveMenu( 'nested-sub-menu' );
						} }
					>
						Open the Nested Sub-Menu menu
					</Button>
				</p>
				<p>
					<Button
						variant="secondary"
						onClick={ () => {
							setActiveItem( 'child-2' );
							setActiveMenu( 'sub-menu' );
						} }
					>
						Navigate to Child 2 item
					</Button>
				</p>
			</div>
		</>
	);
};
