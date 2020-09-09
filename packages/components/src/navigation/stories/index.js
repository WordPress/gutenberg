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
import NavigationLevel from '../level';

export default {
	title: 'Components/Navigation',
	component: Navigation,
};

const Container = styled.div`
	max-width: 246px;
`;

function Example() {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );
	const [ activeLevel, setActiveLevel ] = useState( 'root' );

	return (
		<Container>
			<Navigation
				activeItem={ activeItem }
				activeLevel={ activeLevel }
				setActiveItem={ setActiveItem }
				setActiveLevel={ setActiveLevel }
			>
				<NavigationLevel title="Home">
					<NavigationGroup title="Group 1">
						<NavigationItem item="item-1" title="Item 1" />
						<NavigationItem item="item-2" title="Item 2" />
						<NavigationItem
							badge="2"
							item="item-3"
							navigateToLevel="category"
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
				</NavigationLevel>

				<NavigationLevel
					level="category"
					parentLevel="root"
					parentLevelTitle="Home"
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
							navigateToLevel="nested-category"
							item="child-3"
							title="Nested Category"
						/>
					</ul>
				</NavigationLevel>

				<NavigationLevel
					level="nested-category"
					parentLevel="category"
					parentLevelTitle="Category"
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
				</NavigationLevel>

				<NavigationLevel title="Secondary Menu">
					<ul>
						<NavigationItem
							navigateToLevel="secondary-level"
							item="secondary-item-1"
							title="Secondary Item 1"
						/>
						<NavigationItem
							item="secondary-item-2"
							title="Secondary Item 2"
						/>
					</ul>
				</NavigationLevel>

				<NavigationLevel
					level="secondary-level"
					parentLevel="root"
					parentLevelTitle="Home"
					title="Secondary Item 1"
				>
					<ul>
						<NavigationItem
							item="secondary-child-1"
							title="Secondary Child 1"
						/>
						<NavigationItem
							item="secondary-child-2"
							title="Secondary Child 2"
						/>
					</ul>
				</NavigationLevel>
			</Navigation>

			<Button
				onClick={ () => {
					setActiveItem( 'child-2' );
					setActiveLevel( 'category' );
				} }
				style={ { position: 'absolute', bottom: 0 } }
			>
				Non-navigation link to Child 2
			</Button>
		</Container>
	);
}

export const _default = () => <Example />;
