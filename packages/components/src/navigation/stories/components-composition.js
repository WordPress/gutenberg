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
				initialActiveItem={ item }
				initialActiveLevel={ level }
				setInitialActiveItem={ setItem }
				setInitialActiveLevel={ setLevel }
			>
				<NavigationLevel title="Home">
					<NavigationItem itemId="item-1" title="Item 1" />
					<NavigationItem itemId="item-2" title="Item 2" />
					<NavigationItem
						badge="2"
						navigateToLevel="category"
						itemId="item-3"
						title="Category"
					/>
					<NavigationItem
						href="https://wordpress.org/"
						itemId="item-4"
						target="_blank"
						title="External link"
					/>
					<NavigationItem itemId="item-5">
						<img
							alt="WordPress Logo"
							src="https://s.w.org/style/images/about/WordPress-logotype-wmark-white.png"
							style={ { width: 50, height: 50 } }
						/>
					</NavigationItem>
				</NavigationLevel>

				<NavigationLevel
					levelId="category"
					parentLevelId="root"
					parentLevelTitle="Home"
					title="Category"
				>
					<NavigationItem
						badge="1"
						itemId="child-1"
						title="Child 1"
					/>
					<NavigationItem itemId="child-2" title="Child 2" />
					<NavigationItem
						navigateToLevel="nested-category"
						itemId="child-3"
						title="Nested Category"
					/>
				</NavigationLevel>

				<NavigationLevel
					levelId="nested-category"
					parentLevelId="category"
					parentLevelTitle="Category"
					title="Nested Category"
				>
					<NavigationItem itemId="sub-child-1" title="Sub Child 1" />
					<NavigationItem itemId="sub-child-2" title="Sub Child 2" />
				</NavigationLevel>

				<NavigationLevel title="Secondary Menu">
					<NavigationItem
						navigateToLevel="secondary-level"
						itemId="secondary-item-1"
						title="Secondary Item 1"
					/>
					<NavigationItem
						itemId="secondary-item-2"
						title="Secondary Item 2"
					/>
				</NavigationLevel>

				<NavigationLevel
					levelId="secondary-level"
					parentLevelId="root"
					parentLevelTitle="Home"
					title="Secondary Item 1"
				>
					<NavigationItem
						itemId="secondary-child-1"
						title="Secondary Child 1"
					/>
					<NavigationItem
						itemId="secondary-child-2"
						title="Secondary Child 2"
					/>
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
