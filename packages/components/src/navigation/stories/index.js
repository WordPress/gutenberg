/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

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

	const [ delayedBadge, setDelayedBadge ] = useState();
	useEffect( () => {
		const timeout = setTimeout( () => setDelayedBadge( 2 ), 1500 );
		return () => clearTimeout( timeout );
	} );

	// Mock navigation link
	const Link = ( { href, children } ) => (
		<a
			className="components-button"
			href={ href }
			// Since we're not actually navigating pages, simulate it with on onClick
			onClick={ ( event ) => {
				event.preventDefault();
				const item = href.replace( 'https://example.com/', '' );
				setActiveItem( item );
			} }
		>
			{ children }
		</a>
	);

	return (
		<Container>
			<Navigation
				activeItem={ activeItem }
				activeMenu={ activeMenu }
				onActivateMenu={ setActiveMenu }
			>
				<NavigationMenu title="Home">
					<NavigationGroup title="Group 1">
						<NavigationItem item="item-1" title="Item 1">
							<Link href="https://example.com/item-1">
								Item 1
							</Link>
						</NavigationItem>
						<NavigationItem item="item-2">
							<Link href="https://example.com/item-2">
								Item 2
							</Link>
						</NavigationItem>
						<NavigationItem
							badge="2"
							item="item-3"
							navigateToMenu="category"
							title="Category"
						/>
						<NavigationItem
							badge={ delayedBadge }
							item="item-3-fetching-badge"
							navigateToMenu="category"
							title="Delayed badge"
						/>
						<NavigationItem
							item="item-pointing-non-existing-menu"
							title="Navigate to a non existing menu"
							navigateToMenu="non-existing-menu"
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
							<a
								href="https://wordpress.org/"
								// Since we're not actually navigating pages, simulate it with on onClick
								onClick={ ( event ) => {
									event.preventDefault();
									setActiveItem( 'item-5' );
								} }
							>
								<img
									alt="WordPress Logo"
									src="https://s.w.org/style/images/about/WordPress-logotype-wmark-white.png"
									style={ { width: 50, height: 50 } }
								/>
							</a>
						</NavigationItem>
					</NavigationGroup>
				</NavigationMenu>

				<NavigationMenu
					backButtonLabel="Home"
					menu="category"
					parentMenu="root"
					title="Category"
				>
					<NavigationItem
						badge="1"
						item="child-1"
						title="Child 1"
						onClick={ () => setActiveItem( 'child-1' ) }
					/>
					<NavigationItem
						item="child-2"
						title="Child 2"
						onClick={ () => setActiveItem( 'child-2' ) }
					/>
					<NavigationItem
						navigateToMenu="nested-category"
						item="child-3"
						title="Nested Category"
					/>
					<NavigationItem
						navigateToMenu="custom-back"
						item="child-4"
						title="Custom back"
					/>
					<NavigationItem
						navigateToMenu="automatic-back"
						item="child-5"
						title="Automatic back"
					/>
				</NavigationMenu>

				<NavigationMenu
					backButtonLabel="Category"
					menu="nested-category"
					parentMenu="category"
					title="Nested Category"
				>
					<NavigationItem
						item="sub-child-1"
						title="Sub Child 1"
						onClick={ () => setActiveItem( 'sub-child-1' ) }
					/>
					<NavigationItem
						item="sub-child-2"
						title="Sub Child 2"
						onClick={ () => setActiveItem( 'sub-child-2' ) }
					/>
				</NavigationMenu>

				<NavigationMenu
					backButtonLabel="Custom back"
					menu="custom-back"
					parentMenu="category"
					title="Custom backButtonLabel"
				>
					<NavigationItem item="sub-2-child-1" title="Sub Child 1" />
					<NavigationItem item="sub-2-child-2" title="Sub Child 2" />
				</NavigationMenu>

				<NavigationMenu
					menu="automatic-back"
					parentMenu="category"
					title="Automatic backButtonLabel"
				>
					<NavigationItem item="sub-3-child-1" title="Sub Child 1" />
					<NavigationItem item="sub-3-child-2" title="Sub Child 2" />
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
