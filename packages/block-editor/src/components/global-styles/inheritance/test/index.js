/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getInheritanceProps,
	InheritanceOriginButton,
	InheritanceToolsPanelItem,
} from '../';

describe( 'InheritanceOriginButton', () => {
	test( 'renders an always-visible indicator', () => {
		render( <InheritanceOriginButton stylePath="typography.fontSize" /> );
		expect(
			screen.getByRole( 'button', {
				name: /where does/i,
			} )
		).toBeVisible();
	} );

	// The indicator opens the cascade; it must never reset on click.
	test( 'does not reset when activated', async () => {
		const onReset = jest.fn();
		render(
			<InheritanceOriginButton
				stylePath="typography.fontSize"
				onReset={ onReset }
			/>
		);
		await click(
			screen.getByRole( 'button', {
				name: /where does/i,
			} )
		);
		expect( onReset ).not.toHaveBeenCalled();
	} );

	test( 'opens a popover exposing the reset for the overridden value', async () => {
		const onReset = jest.fn();
		render(
			<InheritanceOriginButton
				stylePath="typography.fontSize"
				label="Size"
				onReset={ onReset }
			/>
		);
		await click(
			screen.getByRole( 'button', {
				name: /where does/i,
			} )
		);
		const reset = screen.getByRole( 'button', {
			name: /^(Reset to|Clear)/,
		} );
		expect( reset ).toBeVisible();
		await click( reset );
		expect( onReset ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not expose a menu or a push-to-Global-Styles action', () => {
		render( <InheritanceOriginButton stylePath="typography.fontSize" /> );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitem', { name: /Make default/ } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'getInheritanceProps', () => {
	test( 'returns explicit false state when neither flag is set', () => {
		expect( getInheritanceProps( false, false ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
	} );

	test( 'emits no className for the inherited state', () => {
		// Inheritance is the unmarked default: no class hook, no treatment.
		// The flag is still returned so callers need not change.
		expect( getInheritanceProps( true, false ) ).toEqual( {
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
			isInherited: true,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( 0, 'local' ) ).toEqual( {
			className: 'has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'passes a base className through untouched in the inherited state', () => {
		expect( getInheritanceProps( true, false, 'single-column' ) ).toEqual( {
			className: 'single-column',
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

describe( 'InheritanceToolsPanelItem inherited state', () => {
	function renderInheritedItem( label, labelClassName ) {
		return render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					{ ...getInheritanceProps( true, false ) }
					label={ label }
					panelId="panel"
					isShownByDefault
					hasValue={ () => false }
				>
					<div className={ labelClassName }>{ label }</div>
				</InheritanceToolsPanelItem>
			</ToolsPanel>
		);
	}

	// Inheritance is the unmarked default, so an inherited control must carry
	// no treatment hook at all. Both label archetypes are covered because a
	// bare `UnitControl`/`NumberControl` exposes `input-control__label` rather
	// than the usual `base-control__label`.
	test.each( [
		[ 'base-control', 'components-base-control__label' ],
		[ 'input-control', 'components-input-control__label' ],
	] )(
		'leaves the %s label unmarked in the inherited state',
		( _name, labelClassName ) => {
			renderInheritedItem( 'Line height', labelClassName );
			const label = screen.getByText( 'Line height' );
			expect( label ).toHaveClass( labelClassName );
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				label.closest( '.is-inherited-from-global-styles' )
			).toBeNull();
		}
	);

	test( 'does not render a reset dot in the inherited state', () => {
		renderInheritedItem( 'Line height', 'components-base-control__label' );
		expect(
			screen.queryByRole( 'button', { name: /where does/i } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'InheritanceToolsPanelItem local-override origin dot', () => {
	function renderItem( props ) {
		return render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					label="Line height"
					panelId="panel"
					isShownByDefault
					hasValue={ () => false }
					{ ...props }
				>
					<div className="components-base-control__label">
						Line height
					</div>
				</InheritanceToolsPanelItem>
			</ToolsPanel>
		);
	}

	test( 'renders the reset dot as a sibling of the control, not inside the label', () => {
		renderItem( {
			hasLocalOverride: true,
			onDeselect: () => {},
		} );
		const resetButton = screen.getByRole( 'button', {
			name: /where does/i,
		} );
		expect( resetButton ).toBeVisible();

		// The reset dot is a plain sibling; it must never be nested inside
		// the label (which would create an interactive-in-label a11y issue).
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			resetButton.closest( '.components-base-control__label' )
		).toBeNull();
	} );

	test( 'does not render the item reset dot when showLocalOverrideActionsInLabel is false', () => {
		// Color/background render their own reset control next to a custom
		// toggle, so the item must not render a second one.
		renderItem( {
			hasLocalOverride: true,
			showLocalOverrideActionsInLabel: false,
			onDeselect: () => {},
		} );
		expect(
			screen.queryByRole( 'button', { name: /where does/i } )
		).not.toBeInTheDocument();
	} );

	// The dot used to reset on click. It now opens the Style origins cascade
	// instead, where the reset is shown next to the value it would restore.
	test( 'the dot does not reset the value', async () => {
		const onDeselect = jest.fn();
		renderItem( { hasLocalOverride: true, onDeselect } );
		await click(
			screen.getByRole( 'button', {
				name: /where does/i,
			} )
		);
		expect( onDeselect ).not.toHaveBeenCalled();
	} );

	test( 'does not offset the reset dot by default', () => {
		renderItem( { hasLocalOverride: true, onDeselect: () => {} } );
		const resetButton = screen.getByRole( 'button', {
			name: /where does/i,
		} );
		const affordance =
			// eslint-disable-next-line testing-library/no-node-access
			resetButton.closest( '.global-styles-inheritance-affordance' );
		expect( affordance ).not.toHaveClass(
			'global-styles-inheritance-affordance--offset-toggle'
		);
	} );

	test( 'offsets the reset dot when the control has an inline-end toggle', () => {
		renderItem( {
			hasLocalOverride: true,
			hasInlineEndToggle: true,
			onDeselect: () => {},
		} );
		const resetButton = screen.getByRole( 'button', {
			name: /where does/i,
		} );
		const affordance =
			// eslint-disable-next-line testing-library/no-node-access
			resetButton.closest( '.global-styles-inheritance-affordance' );
		expect( affordance ).toHaveClass(
			'global-styles-inheritance-affordance--offset-toggle'
		);
	} );
} );
