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
import ComponentsCompositionNavigation, {
	NavigationGroup,
	NavigationItem,
	NavigationLevel,
} from '../components-composition-navigation';

export default {
	title: 'Components/Navigation/Components Composition',
	component: ComponentsCompositionNavigation,
};

const Container = styled.div`
	max-width: 246px;
`;

function ComponentsCompositionExample() {
	const [ item, setItem ] = useState( 'item-1' );
	const [ level, setLevel ] = useState( 'root' );

	return (
		<Container>
			<ComponentsCompositionNavigation
				activeItem={ item }
				activeLevel={ level }
				setActiveItem={ setItem }
				setActiveLevel={ setLevel }
			>
				<NavigationLevel title="Home">
					<NavigationGroup title="Group 1">
						<NavigationItem item="item-1" title="Item 1" />
						<NavigationItem item="item-2" title="Item 2" />
						<NavigationItem
							badge="2"
							navigateToLevel="category"
							item="item-3"
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
			</ComponentsCompositionNavigation>

			<Button
				onClick={ () => {
					setItem( 'child-2' );
					setLevel( 'category' );
				} }
				style={ { position: 'absolute', bottom: 0 } }
			>
				Non-navigation link to Child 2
			</Button>
		</Container>
	);
}

export const _default = () => <ComponentsCompositionExample />;
