/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationGroup from '../group';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

export default {
	title: 'Components/Navigation',
	component: Navigation,
};

const Container = styled.div`
	max-width: 246px;
`;

function Example() {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );
	const [ activeMenu, setActiveMenu ] = useState( 'root' );

	return (
		<Container>
			<Navigation
				activeItem={ activeItem }
				activeMenu={ activeMenu }
				onActivateItem={ setActiveItem }
				onActivateMenu={ setActiveMenu }
			>
				<NavigationMenu title="Home">
					<NavigationGroup title="Group 1">
						<NavigationItem item="item-1" title="Item 1" />
						<NavigationItem item="item-2" title="Item 2" />
						<NavigationItem
							badge="2"
							item="item-3"
							navigateToMenu="category"
							title="Category"
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
							<img
								alt="WordPress Logo"
								src="https://s.w.org/style/images/about/WordPress-logotype-wmark-white.png"
								style={ { width: 50, height: 50 } }
							/>
						</NavigationItem>
					</NavigationGroup>
				</NavigationMenu>

				<NavigationMenu
					backButtonLabel="Home"
					menu="category"
					parentMenu="root"
					title="Category"
				>
					<ul>
						<NavigationItem
							badge="1"
							item="child-1"
							title="Child 1"
						/>
						<NavigationItem item="child-2" title="Child 2" />
						<NavigationItem
							navigateToMenu="nested-category"
							item="child-3"
							title="Nested Category"
						/>
					</ul>
				</NavigationMenu>

				<NavigationMenu
					backButtonLabel="Category"
					menu="nested-category"
					parentMenu="category"
					title="Nested Category"
				>
					<ul>
						<NavigationItem
							item="sub-child-1"
							title="Sub Child 1"
						/>
						<NavigationItem
							item="sub-child-2"
							title="Sub Child 2"
						/>
					</ul>
				</NavigationMenu>
			</Navigation>

			<div style={ { margin: '48px 0 0 24px' } }>
				<p>
					Item <code>{ activeItem }</code> is active.
				</p>

				<Button
					isSecondary
					onClick={ () => {
						setActiveItem( 'child-2' );
						setActiveMenu( 'category' );
					} }
					style={ { marginTop: '12px' } }
				>
					Link to Child 2
				</Button>
			</div>
		</Container>
	);
}

export const _default = () => <Example />;
