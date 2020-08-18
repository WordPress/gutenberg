/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Navigation from '../';
import NavigationMenu from '../menu';
import NavigationMenuItem from '../menu-item';

export default {
	title: 'Components/Navigation',
	component: Navigation,
};

const data = [
	{
		title: 'Item 1',
		id: 'item-1',
	},
	{
		title: 'Item 2',
		id: 'item-2',
	},
	{
		title: 'Category',
		id: 'item-3',
		badge: '2',
	},
	{
		title: 'Child 1',
		id: 'child-1',
		parent: 'item-3',
		badge: '1',
	},
	{
		title: 'Child 2',
		id: 'child-2',
		parent: 'item-3',
	},
];

function Example() {
	const [ active, setActive ] = useState( 'item-1' );

	return (
		<Navigation activeItemId={ active } data={ data } rootTitle="Home">
			{ ( { level, levelItems, parentLevel, setActiveLevel } ) => {
				return (
					<>
						{ parentLevel && (
							<Button
								isPrimary
								onClick={ () =>
									setActiveLevel( parentLevel.id )
								}
							>
								Back
							</Button>
						) }
						<h1>{ level.title }</h1>
						<NavigationMenu>
							{ levelItems.map( ( item ) => {
								return (
									<NavigationMenuItem
										{ ...item }
										key={ item.id }
										onClick={ ( selected ) =>
											setActive( selected.id )
										}
										setActiveLevel={ setActiveLevel }
									/>
								);
							} ) }
						</NavigationMenu>
					</>
				);
			} }
		</Navigation>
	);
}

export const _default = () => {
	return <Example />;
};
