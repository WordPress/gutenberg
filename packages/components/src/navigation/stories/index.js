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
	},
	{
		title: 'Child 1',
		id: 'child-1',
		parent: 'item-3',
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
		<Navigation activeId={ active } items={ data } rootTitle="Home">
			{ ( { currentItems, currentLevel, backItem } ) => {
				return (
					<>
						{ backItem && (
							<Button
								isPrimary
								onClick={ () => setActive( backItem.id ) }
							>
								Back
							</Button>
						) }
						<h1>{ currentLevel.title }</h1>
						<NavigationMenu>
							{ currentItems.map( ( item ) => {
								return (
									<NavigationMenuItem
										{ ...item }
										key={ item.id }
										onClick={ ( selected ) =>
											setActive( selected.id )
										}
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
