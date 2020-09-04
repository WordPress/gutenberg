/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import ComponentsCompositionNavigation from '../components-composition-navigation';

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
				initialActiveItem="item-5"
				initialActiveLevel="root"
			>
				{ ( { NavigationItem, NavigationLevel } ) => (
					<>
						<NavigationLevel level="root" title="Home">
							<NavigationItem slug="item-5" title="Item 5" />
							<NavigationItem
								slug="item-1"
								title="Item 1"
								navigateToLevel="sub-menu"
							/>
						</NavigationLevel>

						<NavigationLevel
							level="sub-menu"
							title="Sub Menu"
							parentLevel="root"
							parentTite="Home"
						>
							<NavigationItem
								slug="item-2"
								title="Item 2"
								navigateToLevel="nested-sub-menu"
							/>
						</NavigationLevel>

						<NavigationLevel
							level="nested-sub-menu"
							title="SubSub Menu"
							parentLevel="sub-menu"
							parentTite="Sub Menu"
						>
							<NavigationItem slug="item-3" title="Item 3" />
							<NavigationItem slug="item-4" title="Item 4" />
						</NavigationLevel>
					</>
				) }
			</ComponentsCompositionNavigation>
		</Container>
	);
}

export const _default = () => <ComponentsCompositionExample />;
