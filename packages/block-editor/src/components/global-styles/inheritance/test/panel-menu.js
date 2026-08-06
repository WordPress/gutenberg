/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import { click } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InheritanceToolsPanelItem } from '../';
import {
	InheritanceMenuProvider,
	InheritanceToolsPanel,
	useInheritanceMenuItem,
} from '../panel-menu';

jest.mock( '../../style-origins/use-cascade', () => ( {
	// Returns a fixed cascade for whichever paths a control declares, so these
	// tests cover the menu wiring rather than cascade resolution — that is
	// exercised against the engine in `global-styles-engine`.
	useControlCascade: ( stylePaths ) =>
		stylePaths?.length
			? stylePaths.map( ( path ) => ( {
					path,
					property: path.split( '.' ).pop(),
					entries: [
						{
							label: 'This block',
							value: '2rem',
							isWinner: true,
						},
						{
							label: 'Site-wide',
							value: '1rem',
							isWinner: false,
						},
					],
			  } ) )
			: [],
} ) );

/**
 * A panel holding a `Size` and a `Line height` control, each of which can hold
 * a local value on top of an inherited one.
 *
 * @param {Object} props
 * @param {Object} props.initial Initial local values, keyed by control label.
 */
function TestPanel( { initial } ) {
	const [ values, setValues ] = useState( initial );

	const item = ( label, stylePaths ) => (
		<InheritanceToolsPanelItem
			key={ label }
			label={ label }
			stylePaths={ stylePaths }
			hasValue={ () => values[ label ] !== undefined }
			hasLocalOverride={ values[ label ] !== undefined }
			isInherited={ values[ label ] === undefined }
			onDeselect={ () =>
				setValues( { ...values, [ label ]: undefined } )
			}
			isShownByDefault
			panelId="test-panel"
		>
			<span>{ label }</span>
		</InheritanceToolsPanelItem>
	);

	return (
		<InheritanceToolsPanel
			label="Typography"
			panelId="test-panel"
			resetAll={ () => setValues( {} ) }
		>
			{ item( 'Size', [ 'typography.fontSize' ] ) }
			{ item( 'Line height', [ 'typography.lineHeight' ] ) }
		</InheritanceToolsPanel>
	);
}

const openPanelMenu = async () =>
	click( screen.getByRole( 'button', { name: 'Typography options' } ) );

describe( 'Global Styles inheritance in the panel options menu', () => {
	beforeEach( () => {
		window.__experimentalGlobalStylesInheritanceUI = true;
	} );

	afterEach( () => {
		delete window.__experimentalGlobalStylesInheritanceUI;
	} );

	test( 'leaves the control rows free of any override indicator', () => {
		render( <TestPanel initial={ { Size: '2rem' } } /> );

		expect(
			screen.queryByRole( 'button', { name: 'Reset to inherited value' } )
		).not.toBeInTheDocument();
	} );

	test( 'renders a panel that overrides identically to one that does not', () => {
		// Nothing at rest, including on the panel's own options toggle: with
		// the menu closed, an overriding panel is indistinguishable from a
		// panel with nothing set.
		const toggleMarkup = ( container ) =>
			within( container ).getByRole( 'button', {
				name: 'Typography options',
			} ).outerHTML;

		const { container, unmount } = render(
			<TestPanel initial={ { Size: '2rem' } } />
		);
		const overridingMarkup = toggleMarkup( container );
		unmount();

		const { container: inheritingContainer } = render(
			<TestPanel initial={ {} } />
		);

		expect( overridingMarkup ).toBe( toggleMarkup( inheritingContainer ) );
	} );

	test( 'shows the cascade under the overriding control, and only that one', async () => {
		render( <TestPanel initial={ { Size: '2rem' } } /> );
		await openPanelMenu();

		expect(
			screen.getByRole( 'menuitem', { name: 'Reset Size' } )
		).toHaveAccessibleDescription( /This block.*2rem.*Site-wide.*1rem/s );

		// The inheriting control's row carries no cascade at all.
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Line height' } )
		).not.toHaveAccessibleDescription();
	} );

	test( 'keeps the cascade out of the menu row itself', async () => {
		render( <TestPanel initial={ { Size: '2rem' } } /> );
		await openPanelMenu();

		// Referenced as the item's description rather than nested inside it:
		// nested content would land in the accessible *name*, making every
		// overriding control impossible to query by its own label. It also
		// keeps `role="menu"` holding only menu items.
		expect(
			screen.getByRole( 'menuitem', { name: 'Reset Size' } )
		).toHaveAccessibleName( 'Reset Size' );
	} );

	test( "the control's own Reset is what puts the value back", async () => {
		render( <TestPanel initial={ { Size: '2rem' } } /> );
		await openPanelMenu();
		await click( screen.getByRole( 'menuitem', { name: 'Reset Size' } ) );

		await openPanelMenu();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Reset Size' } )
		).not.toBeInTheDocument();
	} );

	test( 'adds no separate restore action of its own', async () => {
		render( <TestPanel initial={ { Size: '2rem' } } /> );
		await openPanelMenu();

		expect(
			screen.queryByRole( 'menuitem', {
				name: 'Restore inherited styles',
			} )
		).not.toBeInTheDocument();
	} );

	test( 'adds nothing to the menu when the experiment is off', async () => {
		delete window.__experimentalGlobalStylesInheritanceUI;
		render( <TestPanel initial={ { Size: '2rem' } } /> );
		await openPanelMenu();

		expect(
			screen.getByRole( 'menuitem', { name: 'Reset Size' } )
		).not.toHaveAccessibleDescription();
	} );

	test( 'is inert outside a provider', () => {
		const Probe = () => {
			useInheritanceMenuItem( 'Size', true, [ 'typography.fontSize' ] );
			return <span>probe</span>;
		};
		expect( () => render( <Probe /> ) ).not.toThrow();
	} );

	test( 'exposes the provider for slot-boundary forwarding', () => {
		expect( () =>
			render(
				<InheritanceMenuProvider>
					<span>child</span>
				</InheritanceMenuProvider>
			)
		).not.toThrow();
	} );
} );
