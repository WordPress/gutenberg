/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
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
	InheritanceIndicatorButton,
	InheritanceToolsPanelItem,
} from '../';

describe( 'InheritanceIndicatorButton', () => {
	test( 'renders an always-visible indicator labelled for the inherited value', () => {
		render( <InheritanceIndicatorButton /> );
		expect(
			screen.getByRole( 'button', {
				name: 'Inherited from Global Styles',
			} )
		).toBeVisible();
	} );

	test( 'carries no action in the inherited state', async () => {
		const onResetToInherited = jest.fn();
		const onClick = jest.fn();
		render(
			<div onClick={ onClick } role="presentation">
				<InheritanceIndicatorButton
					onResetToInherited={ onResetToInherited }
				/>
			</div>
		);
		await click(
			screen.getByRole( 'button', {
				name: 'Inherited from Global Styles',
			} )
		);
		expect( onResetToInherited ).not.toHaveBeenCalled();
		expect( onClick ).not.toHaveBeenCalled();
	} );

	test( 'relabels as the reset action when a local override is set', () => {
		render( <InheritanceIndicatorButton hasLocalOverride /> );
		expect(
			screen.getByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).toBeVisible();
	} );

	test( 'invokes the reset handler when activated in the override state', async () => {
		const onResetToInherited = jest.fn();
		render(
			<InheritanceIndicatorButton
				hasLocalOverride
				onResetToInherited={ onResetToInherited }
			/>
		);
		await click(
			screen.getByRole( 'button', { name: 'Reset to inherited value' } )
		);
		expect( onResetToInherited ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not expose a menu or a push-to-Global-Styles action', () => {
		render( <InheritanceIndicatorButton hasLocalOverride /> );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitem', { name: /Make default/ } )
		).not.toBeInTheDocument();
	} );

	test( 'keeps the same button element and its focus after a reset', async () => {
		const { rerender } = render(
			<InheritanceIndicatorButton hasLocalOverride />
		);
		const button = screen.getByRole( 'button', {
			name: 'Reset to inherited value',
		} );
		await act( async () => button.focus() );
		expect( button ).toHaveFocus();

		rerender( <InheritanceIndicatorButton hasLocalOverride={ false } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Inherited from Global Styles',
			} )
		).toBe( button );
		expect( button ).toHaveFocus();
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
	function renderInheritedItem( props ) {
		return render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					{ ...getInheritanceProps( true, false ) }
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

	test( 'renders the inherited indicator as a sibling of the control, not inside the label', () => {
		renderInheritedItem();
		const indicator = screen.getByRole( 'button', {
			name: 'Inherited from Global Styles',
		} );
		expect( indicator ).toBeVisible();
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			indicator.closest( '.components-base-control__label' )
		).toBeNull();
	} );

	test( 'does not render the indicator when showInheritanceAffordance is false', () => {
		renderInheritedItem( { showInheritanceAffordance: false } );
		expect(
			screen.queryByRole( 'button', {
				name: 'Inherited from Global Styles',
			} )
		).not.toBeInTheDocument();
	} );

	test( 'does not render a reset dot in the inherited state', () => {
		renderInheritedItem();
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

	test( 'does not render the item reset dot when showInheritanceAffordance is false', () => {
		// Color/background render their own reset control next to a custom
		// toggle, so the item must not render a second one.
		renderItem( {
			hasLocalOverride: true,
			showInheritanceAffordance: false,
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
