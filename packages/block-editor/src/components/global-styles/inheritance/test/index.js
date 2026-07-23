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
	InheritanceResetButton,
	InheritanceToolsPanelItem,
} from '../';

describe( 'InheritanceResetButton', () => {
	test( 'renders an always-visible reset button labelled for the inherited value', () => {
		render( <InheritanceResetButton onResetToInherited={ () => {} } /> );
		expect(
			screen.getByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).toBeVisible();
	} );

	test( 'invokes the reset handler when activated', async () => {
		const onResetToInherited = jest.fn();
		render(
			<InheritanceResetButton onResetToInherited={ onResetToInherited } />
		);
		await click(
			screen.getByRole( 'button', { name: 'Reset to inherited value' } )
		);
		expect( onResetToInherited ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not expose a menu or a push-to-Global-Styles action', () => {
		render( <InheritanceResetButton onResetToInherited={ () => {} } /> );
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

	test( 'returns ONLY the inherited className when isInherited is set', () => {
		// The inherited state is conveyed purely through the className hook
		// (`is-inherited-from-global-styles`), which the SCSS uses to apply
		// the dotted-underline label treatment. No dot is rendered.
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

	// The SCSS treatment keys off the label class, and controls on a bare
	// `UnitControl`/`NumberControl` expose `input-control__label` rather than
	// the usual `base-control__label`, so guard both.
	test.each( [
		[ 'base-control', 'components-base-control__label' ],
		[ 'input-control', 'components-input-control__label' ],
	] )(
		'nests the %s label inside the inherited-from-global-styles item',
		( _name, labelClassName ) => {
			renderInheritedItem( 'Line height', labelClassName );
			const label = screen.getByText( 'Line height' );
			expect( label ).toHaveClass( labelClassName );
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				label.closest( '.is-inherited-from-global-styles' )
			).not.toBeNull();
		}
	);

	test( 'does not render a reset dot in the inherited state', () => {
		renderInheritedItem( 'Line height', 'components-base-control__label' );
		expect(
			screen.queryByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).not.toBeInTheDocument();
	} );
} );

describe( 'InheritanceToolsPanelItem local-override reset dot', () => {
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
			name: 'Reset to inherited value',
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
			screen.queryByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).not.toBeInTheDocument();
	} );

	test( 'the reset dot invokes the deselect handler', async () => {
		const onDeselect = jest.fn();
		renderItem( { hasLocalOverride: true, onDeselect } );
		await click(
			screen.getByRole( 'button', { name: 'Reset to inherited value' } )
		);
		expect( onDeselect ).toHaveBeenCalled();
	} );

	test( 'does not offset the reset dot by default', () => {
		renderItem( { hasLocalOverride: true, onDeselect: () => {} } );
		const resetButton = screen.getByRole( 'button', {
			name: 'Reset to inherited value',
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
			name: 'Reset to inherited value',
		} );
		const affordance =
			// eslint-disable-next-line testing-library/no-node-access
			resetButton.closest( '.global-styles-inheritance-affordance' );
		expect( affordance ).toHaveClass(
			'global-styles-inheritance-affordance--offset-toggle'
		);
	} );
} );
