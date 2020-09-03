/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
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

// This is a custom click handler to mimic a page change,
// but this would typically be handle by the router.
const onClick = ( e, props ) => {
	e.preventDefault();
	window.history.pushState( {}, null, props.href );
};

const data = [
	{
		title: 'Item 1',
		id: 'item-1',
		href: '#item-1',
		onClick,
	},
	{
		title: 'Item 2',
		id: 'item-2',
		href: '#item-2',
		onClick,
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
		href: '#child-1',
		onClick,
	},
	{
		title: 'Child 2',
		id: 'child-2',
		parent: 'item-3',
		href: '#child-2',
		onClick,
	},
	{
		title: 'Nested Category',
		id: 'child-3',
		parent: 'item-3',
		href: '#child-3',
		onClick,
	},
	{
		title: 'Sub Child 1',
		id: 'sub-child-1',
		parent: 'child-3',
		href: '#sub-child-1',
		onClick,
	},
	{
		title: 'Sub Child 2',
		id: 'sub-child-2',
		parent: 'child-3',
		href: '#sub-child-2',
		onClick,
	},
	{
		title: 'External link',
		id: 'item-4',
		href: 'https://wordpress.org',
		linkProps: {
			target: '_blank',
		},
	},
	{
		title: 'Internal link',
		id: 'item-5',
		LinkComponent: CustomRouterLink,
		href: '#internal',
		onClick,
	},
];

function Example() {
	return (
		<>
			{ window.location.pathname !== '/child-2' ? (
				<Button
					style={ { position: 'absolute', bottom: 0 } }
					onClick={ () =>
						window.history.pushState( {}, null, '#child-2' )
					}
				>
					Non-navigation link to Child 2
				</Button>
			) : null }
			<Navigation data={ data } rootTitle="Home">
				{ ( { level, parentLevel, NavigationBackButton } ) => {
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
								{ level.children.map( ( item ) => {
									return (
										<NavigationMenuItem
											{ ...item }
											key={ item.id }
										/>
									);
								} ) }
							</NavigationMenu>
						</>
					);
				} }
			</Navigation>
		</>
	);
}

export const _default = () => {
	return <Example />;
};
