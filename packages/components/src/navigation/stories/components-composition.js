/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import ComponentsCompositionNavigation, {
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
	return (
		<Container>
			<ComponentsCompositionNavigation
				initialActiveItem="item-1"
				initialActiveLevel="root"
			>
				<NavigationLevel level="root" title="Home">
					<NavigationItem slug="item-1" title="Item 1" />
					<NavigationItem slug="item-2" title="Item 2" />
					<NavigationItem
						badge="2"
						navigateToLevel="category"
						slug="item-3"
						title="Category"
					/>
					<NavigationItem slug="item-4" title="External link" />
					<NavigationItem slug="item-5">
						<img
							alt="WordPress Logo"
							src="https://s.w.org/style/images/about/WordPress-logotype-wmark-white.png"
							style={ { width: 50, height: 50 } }
						/>
					</NavigationItem>
				</NavigationLevel>

				<NavigationLevel
					level="category"
					parentLevel="root"
					parentTitle="Home"
					title="Category"
				>
					<NavigationItem badge="1" slug="child-1" title="Child 1" />
					<NavigationItem slug="child-2" title="Child 2" />
					<NavigationItem
						navigateToLevel="nested-category"
						slug="child-3"
						title="Nested Category"
					/>
				</NavigationLevel>

				<NavigationLevel
					level="nested-category"
					parentLevel="category"
					parentTitle="Category"
					title="Nested Category"
				>
					<NavigationItem slug="sub-child-1" title="Sub Child 1" />
					<NavigationItem slug="sub-child-2" title="Sub Child 2" />
				</NavigationLevel>

				<NavigationLevel level="root" title="Secondary Menu">
					<NavigationItem
						navigateToLevel="secondary-level"
						slug="secondary-item-1"
						title="Secondary Item 1"
					/>
					<NavigationItem
						slug="secondary-item-2"
						title="Secondary Item 2"
					/>
				</NavigationLevel>

				<NavigationLevel
					level="secondary-level"
					parentLevel="root"
					parentTitle="Home"
					title="Secondary Item 1"
				>
					<NavigationItem
						slug="secondary-child-1"
						title="Secondary Child 1"
					/>
					<NavigationItem
						slug="secondary-child-2"
						title="Secondary Child 2"
					/>
				</NavigationLevel>
			</ComponentsCompositionNavigation>
		</Container>
	);
}

export const _default = () => <ComponentsCompositionExample />;
