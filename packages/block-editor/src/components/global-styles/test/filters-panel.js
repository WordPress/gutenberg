/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import FiltersPanel from '../filters-panel';

// The inheritance treatment sits behind the
// `gutenberg-global-styles-inheritance-ui` experiment. Turn it on so these
// tests exercise the inheriting path.
beforeEach( () => {
	window.__experimentalGlobalStylesInheritanceUI = true;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

/**
 * Tests for the inherited Global Styles label treatment in `FiltersPanel`.
 * The panel hosts a single duotone slot rendered as a `Dropdown` whose toggle
 * shows a `DuotoneSwatch`.
 *
 * Display-without-commit behavior is preserved: clicking the preselected
 * inherited duotone preset commits that value rather than clearing the slot.
 */

const baseSettings = {
	color: {
		customDuotone: true,
		defaultDuotone: true,
		duotone: {
			default: [
				{
					name: 'Black and white',
					slug: 'black-and-white',
					colors: [ '#000000', '#ffffff' ],
				},
				{
					name: 'Purple and yellow',
					slug: 'purple-and-yellow',
					colors: [ '#8c00b7', '#fcff41' ],
				},
			],
		},
		palette: {
			default: [
				{ name: 'Black', slug: 'black', color: '#000000' },
				{ name: 'White', slug: 'white', color: '#ffffff' },
			],
		},
	},
};

describe( 'FiltersPanel — visual treatment and display-without-commit', () => {
	it( 'renders the InheritanceResetButton for a local override', () => {
		const inheritedValue = {
			filter: { duotone: [ '#000000', '#ffffff' ] },
		};
		const value = {
			filter: { duotone: [ '#8c00b7', '#fcff41' ] },
		};

		render(
			<FiltersPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect(
			screen.getByRole( 'button', {
				name: /reset to inherited value/i,
			} )
		).toBeInTheDocument();
	} );

	it( 'renders the default reset button for a locally-set duotone with no inherited value', () => {
		const value = {
			filter: { duotone: [ '#8c00b7', '#fcff41' ] },
		};

		render(
			<FiltersPanel
				value={ value }
				inheritedValue={ {} }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect(
			screen.getByRole( 'button', { name: /^reset$/i } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: /reset to inherited value/i,
			} )
		).not.toBeInTheDocument();
	} );

	it( 'does not invoke onChange on mount when only inherited duotone is present (display-without-commit)', () => {
		const onChange = jest.fn();
		const inheritedValue = {
			filter: { duotone: [ '#000000', '#ffffff' ] },
		};

		render(
			<FiltersPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'commits the inherited value when the user clicks the preselected duotone preset', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const inheritedValue = {
			filter: { duotone: [ '#000000', '#ffffff' ] },
		};

		const { container } = render(
			<FiltersPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		// Open the duotone dropdown.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const toggle = container.querySelector(
			'.block-editor-global-styles-filters-panel__dropdown-toggle'
		);
		expect( toggle ).not.toBeNull();
		await user.click( toggle );

		// The popover content is portalled to `document.body`, so it
		// is queried directly. The `DuotonePicker` is rendered with
		// `value={ duotone }` where `duotone` resolves to the inherited
		// value at-rest, so the matching preset has
		// `aria-selected="true"` (the picker is a `role="listbox"`).
		// eslint-disable-next-line testing-library/no-node-access
		const presetButton = document.body.querySelector(
			'.components-circular-option-picker__option[aria-selected="true"]'
		);
		expect( presetButton ).not.toBeNull();
		await user.click( presetButton );

		// The interceptor commits the inherited duotone value rather
		// than clearing the slot.
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		const lastCallArg = onChange.mock.calls[ 0 ][ 0 ];
		expect( lastCallArg?.filter?.duotone ).toEqual( [
			'#000000',
			'#ffffff',
		] );
	} );

	it( 'does not invoke onChange on mount when a local duotone is set (no spurious commit)', () => {
		const onChange = jest.fn();
		const value = {
			filter: { duotone: [ '#8c00b7', '#fcff41' ] },
		};

		render(
			<FiltersPanel
				value={ value }
				inheritedValue={ value }
				settings={ baseSettings }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
