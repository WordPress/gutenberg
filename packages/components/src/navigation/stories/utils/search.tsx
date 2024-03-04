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
import { NavigationGroup } from '../../group';
import { NavigationItem } from '../../item';
import { NavigationMenu } from '../../menu';
import { normalizedSearch } from '../../utils';

const searchItems = [
	{ item: 'foo', title: 'Foo' },
	{ item: 'bar', title: 'Bar' },
	{ item: 'baz', title: 'Baz' },
	{ item: 'qux', title: 'Qux' },
	{ item: 'quux', title: 'Quux' },
	{ item: 'corge', title: 'Corge' },
	{ item: 'grault', title: 'Grault' },
	{ item: 'garply', title: 'Garply' },
	{ item: 'waldo', title: 'Waldo' },
];

export const SearchStory: StoryFn< typeof Navigation > = ( {
	className,
	...props
} ) => {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );
	const [ search, setSearch ] = useState( '' );

	return (
		<Navigation
			{ ...props }
			activeItem={ activeItem }
			className={ [ 'navigation-story', className ]
				.filter( Boolean )
				.join( ' ' ) }
		>
			<NavigationMenu hasSearch title="Home">
				<NavigationGroup title="Items">
					{ searchItems.map( ( { item, title } ) => (
						<NavigationItem
							item={ `item-${ item }` }
							key={ `item-${ item }` }
							onClick={ () => setActiveItem( `item-${ item }` ) }
							title={ title }
						/>
					) ) }
				</NavigationGroup>

				<NavigationGroup title="More Examples">
					<NavigationItem
						item="item-controlled-search"
						navigateToMenu="controlled-search"
						title="Controlled Search"
					/>
				</NavigationGroup>
			</NavigationMenu>

			<NavigationMenu
				hasSearch
				menu="controlled-search"
				onSearch={ ( value ) => setSearch( value ) }
				parentMenu="root"
				search={ search }
				title="Controlled Search"
			>
				{ searchItems
					.filter( ( { title } ) =>
						normalizedSearch( title, search )
					)
					.map( ( { item, title } ) => (
						<NavigationItem
							item={ `child-${ item }` }
							key={ `child-${ item }` }
							onClick={ () => setActiveItem( `child-${ item }` ) }
							title={ title }
						/>
					) ) }
			</NavigationMenu>
		</Navigation>
	);
};
