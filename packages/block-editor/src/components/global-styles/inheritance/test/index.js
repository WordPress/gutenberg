/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click } from '@ariakit/test';

/**
 * Internal dependencies
 */
import { getInheritanceProps, InheritanceActionsDropdown } from '../';

describe( 'InheritanceActionsDropdown', () => {
	async function openMenu() {
		await click(
			screen.getByRole( 'button', { name: 'Local override options' } )
		);
	}

	test( 'shows only the reset action when no push handler is provided', async () => {
		render(
			<InheritanceActionsDropdown onResetToInherited={ () => {} } />
		);
		await openMenu();
		expect(
			screen.getByRole( 'menuitem', { name: 'Reset to inherited value' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Push to global styles' } )
		).not.toBeInTheDocument();
	} );

	test( 'shows and invokes the push action when a handler is provided', async () => {
		const onPushToGlobalStyles = jest.fn();
		const onResetToInherited = jest.fn();
		render(
			<InheritanceActionsDropdown
				onResetToInherited={ onResetToInherited }
				onPushToGlobalStyles={ onPushToGlobalStyles }
			/>
		);
		await openMenu();
		await click(
			screen.getByRole( 'menuitem', { name: 'Push to global styles' } )
		);
		expect( onPushToGlobalStyles ).toHaveBeenCalledTimes( 1 );
		expect( onResetToInherited ).not.toHaveBeenCalled();
	} );
} );

describe( 'getInheritanceProps', () => {
	test( 'returns explicit false state when neither flag is set', () => {
		expect( getInheritanceProps( false, false ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
	} );

	test( 'returns ONLY the inherited className when isInherited is set', () => {
		// The visual treatment for the inherited state is wired by the
		// `<InheritanceToolsPanelItem>` wrapper, which renders its
		// children inside a `<Tooltip>` from `@wordpress/components`.
		// `getInheritanceProps` only emits the className that gates
		// the label colouring; the tooltip text is supplied by the
		// wrapper.
		expect( getInheritanceProps( true, false ) ).toEqual( {
			className: 'is-inherited-from-global-styles',
			isInherited: true,
			hasLocalOverride: false,
		} );
	} );

	test( 'returns the local-override className when hasLocalOverride is set', () => {
		expect( getInheritanceProps( false, true ) ).toEqual( {
			className: 'has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'returns ONLY the local-override className when both flags are passed (mutual exclusion)', () => {
		// A buggy caller could pass both as `true`. The visual
		// contract is mutual exclusion — local-override always wins.
		const result = getInheritanceProps( true, true );
		expect( result.className ).toContain(
			'has-local-override-from-global-styles'
		);
		expect( result.isInherited ).toBe( false );
		expect( result.hasLocalOverride ).toBe( true );
	} );

	test( 'coerces truthy/falsy non-boolean inputs', () => {
		// Common pattern: callers pass an undefined or null inherited
		// value that we want to treat as "no local override" rather
		// than letting it slip through as truthy.
		expect( getInheritanceProps( undefined, undefined ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( null, null ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( '', '' ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
		// Truthy non-boolean
		expect( getInheritanceProps( 'inherited', 0 ) ).toEqual( {
			className: 'is-inherited-from-global-styles',
			isInherited: true,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( 0, 'local' ) ).toEqual( {
			className: 'has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'merges a base className with the inherited class hook', () => {
		expect( getInheritanceProps( true, false, 'single-column' ) ).toEqual( {
			className: 'single-column is-inherited-from-global-styles',
			isInherited: true,
			hasLocalOverride: false,
		} );
	} );

	test( 'merges a base className with the local-override class hook', () => {
		expect( getInheritanceProps( false, true, 'single-column' ) ).toEqual( {
			className: 'single-column has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'returns just the base className when neither flag is set', () => {
		expect( getInheritanceProps( false, false, 'single-column' ) ).toEqual(
			{
				className: 'single-column',
				isInherited: false,
				hasLocalOverride: false,
			}
		);
	} );
} );
