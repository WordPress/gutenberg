/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Icon, arrowLeft } from '@wordpress/icons';

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

// Example Link component from a router such as React Router
const CustomRouterLink = ( { children, onClick } ) => {
	// Here I'm passing the onClick prop for simplicity, but behavior can be
	// anything here.
	return <Button onClick={ onClick }>{ children }</Button>;
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
	{
		title: 'Nested Category',
		id: 'child-3',
		parent: 'item-3',
	},
	{
		title: 'Sub Child 1',
		id: 'sub-child-1',
		parent: 'child-3',
	},
	{
		title: 'Sub Child 2',
		id: 'sub-child-2',
		parent: 'child-3',
	},
	{
		title: 'External link',
		id: 'item-4',
		href: 'https://wordpress.com',
		linkProps: {
			target: '_blank',
		},
	},
	{
		title: 'Internal link',
		id: 'item-5',
		LinkComponent: CustomRouterLink,
	},
];

function Example() {
	const [ active, setActive ] = useState( 'item-1' );

	return (
		<Navigation activeItemId={ active } data={ data } rootTitle="Home">
			{ ( { level, levelItems, parentLevel, NavigationBackButton } ) => {
				return (
					<>
						{ parentLevel && (
							<NavigationBackButton>
								<Icon icon={ arrowLeft } />
								{ parentLevel.title }
							</NavigationBackButton>
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
