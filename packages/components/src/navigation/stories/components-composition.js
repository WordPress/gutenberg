/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import ComponentsCompositionNavigation, {
	NavigationItem,
} from '../components-composition-navigation';

export default {
	title: 'Components/Navigation/Components Composition',
	component: ComponentsCompositionNavigation,
};

const Container = styled.div`
	max-width: 246px;
`;

function ComponentsCompositionExample() {
	const [ activeItem, setActiveItem ] = useState( 'item-5' );
	return (
		<Container>
			<ComponentsCompositionNavigation initialActiveLevel="root">
				{ ( { activeLevel, NavigationCategory, NavigationLevel } ) => (
					<>
						<NavigationLevel
							slug="root"
							title="Home"
							activeLevel={ activeLevel }
						>
							<NavigationItem
								slug="item-5"
								title="Item 5"
								onClick={ () => {
									setActiveItem( 'item-5' );
								} }
								activeItem={ activeItem }
							/>
							<NavigationCategory
								slug="item-1"
								title="Item 1"
								navigateTo="sub-menu"
							/>
						</NavigationLevel>

						<NavigationLevel
							slug="sub-menu"
							title="Sub Menu"
							activeLevel={ activeLevel }
							parentLevel="root"
							parentTite="Home"
						>
							<NavigationCategory
								slug="item-2"
								title="Item 2"
								navigateTo="nested-sub-menu"
							/>
						</NavigationLevel>

						<NavigationLevel
							slug="nested-sub-menu"
							title="SubSub Menu"
							activeLevel={ activeLevel }
							parentLevel="sub-menu"
							parentTite="Sub Menu"
						>
							<NavigationItem
								slug="item-3"
								title="Item 3"
								onClick={ () => {
									setActiveItem( 'item-3' );
								} }
								activeItem={ activeItem }
							/>
							<NavigationItem
								slug="item-4"
								title="Item 4"
								onClick={ () => {
									setActiveItem( 'item-4' );
								} }
								activeItem={ activeItem }
							/>
						</NavigationLevel>
					</>
				) }
			</ComponentsCompositionNavigation>
		</Container>
	);
}

export const _default = () => <ComponentsCompositionExample />;
