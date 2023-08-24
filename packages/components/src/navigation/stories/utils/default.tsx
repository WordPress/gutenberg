/**
 * External dependencies
 */
import type { StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Navigation } from '../..';
import { NavigationItem } from '../../item';
import { NavigationMenu } from '../../menu';

export const DefaultStory: StoryFn< typeof Navigation > = ( {
	className,
	...props
} ) => {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );

	return (
		<Navigation
			{ ...props }
			activeItem={ activeItem }
			className={ [ 'navigation-story', className ]
				.filter( Boolean )
				.join( ' ' ) }
		>
			<NavigationMenu title="Home">
				<NavigationItem
					item="item-1"
					onClick={ () => setActiveItem( 'item-1' ) }
					title="Item 1"
				/>
				<NavigationItem
					item="item-2"
					onClick={ () => setActiveItem( 'item-2' ) }
					title="Item 2"
				/>
				<NavigationItem>
					<a
						className="components-button"
						href="http://www.example.com"
					>
						External Link
					</a>
				</NavigationItem>
				<NavigationItem
					item="item-sub-menu"
					navigateToMenu="sub-menu"
					title="Sub-Menu"
				/>
			</NavigationMenu>
			<NavigationMenu menu="sub-menu" parentMenu="root" title="Sub-Menu">
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
	);
};
