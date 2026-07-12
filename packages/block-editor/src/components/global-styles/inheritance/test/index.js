/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click } from '@ariakit/test';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	BaseControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

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
		expect( getInheritanceProps( true, false, false ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
	} );

	test( 'gates every flag off, but keeps the base className, when indicators are disabled', () => {
		expect(
			getInheritanceProps( false, true, true, 'single-column' )
		).toEqual( {
			className: 'single-column',
			isInherited: false,
			hasLocalOverride: false,
		} );
	} );

	test( 'returns ONLY the inherited className when isInherited is set', () => {
		// The inherited state is conveyed purely through the className hook
		// (`is-inherited-from-global-styles`), which the SCSS uses to apply
		// the dotted-underline label treatment. No dot is rendered.
		expect( getInheritanceProps( true, true, false ) ).toEqual( {
			className: 'is-inherited-from-global-styles',
			isInherited: true,
			hasLocalOverride: false,
		} );
	} );

	test( 'returns the local-override className when hasLocalOverride is set', () => {
		expect( getInheritanceProps( true, false, true ) ).toEqual( {
			className: 'has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'returns ONLY the local-override className when both flags are passed (mutual exclusion)', () => {
		// A buggy caller could pass both as `true`. The visual
		// contract is mutual exclusion — local-override always wins.
		const result = getInheritanceProps( true, true, true );
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
		expect( getInheritanceProps( true, undefined, undefined ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( true, null, null ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( true, '', '' ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
		// Truthy non-boolean
		expect( getInheritanceProps( true, 'inherited', 0 ) ).toEqual( {
			className: 'is-inherited-from-global-styles',
			isInherited: true,
			hasLocalOverride: false,
		} );
		expect( getInheritanceProps( true, 0, 'local' ) ).toEqual( {
			className: 'has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'merges a base className with the inherited class hook', () => {
		expect(
			getInheritanceProps( true, true, false, 'single-column' )
		).toEqual( {
			className: 'single-column is-inherited-from-global-styles',
			isInherited: true,
			hasLocalOverride: false,
		} );
	} );

	test( 'merges a base className with the local-override class hook', () => {
		expect(
			getInheritanceProps( true, false, true, 'single-column' )
		).toEqual( {
			className: 'single-column has-local-override-from-global-styles',
			isInherited: false,
			hasLocalOverride: true,
		} );
	} );

	test( 'returns just the base className when neither flag is set', () => {
		expect(
			getInheritanceProps( true, false, false, 'single-column' )
		).toEqual( {
			className: 'single-column',
			isInherited: false,
			hasLocalOverride: false,
		} );
	} );
} );

describe( 'InheritanceToolsPanelItem inherited state', () => {
	function renderInheritedItem() {
		return render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					{ ...getInheritanceProps( true, true, false ) }
					label="Line height"
					panelId="panel"
					isShownByDefault
					hasValue={ () => false }
				>
					<div className="components-base-control__label">
						Line height
					</div>
				</InheritanceToolsPanelItem>
			</ToolsPanel>
		);
	}

	test( 'does not render a reset dot in the inherited state', () => {
		renderInheritedItem();
		expect(
			screen.queryByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).not.toBeInTheDocument();
	} );
} );

describe( 'InheritanceToolsPanelItem breadcrumb tooltip', () => {
	// A minimal labelled control. The panels pass the breadcrumb `labelTooltip`
	// directly to the control, which renders it on its visible label text \u2014 the
	// panel item itself is not involved in the tooltip.
	function LabelledControl( props ) {
		const id = useInstanceId( LabelledControl, 'line-height' );
		return (
			<BaseControl { ...props } id={ id } label="Line height">
				<input aria-label="Line height" />
			</BaseControl>
		);
	}

	function renderItem( controlProps ) {
		return render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					{ ...getInheritanceProps( true, true, false ) }
					label="Line height"
					panelId="panel"
					isShownByDefault
					hasValue={ () => false }
				>
					<LabelledControl { ...controlProps } />
				</InheritanceToolsPanelItem>
			</ToolsPanel>
		);
	}

	test( 'renders the breadcrumb tooltip on the control label and reveals it on hover', async () => {
		const user = userEvent.setup();
		renderItem( {
			labelTooltip: 'Default inherited from:\nStyles > Heading',
		} );

		// No tooltip until the label is hovered.
		expect(
			screen.queryByText( /Styles > Heading/ )
		).not.toBeInTheDocument();

		await user.hover( screen.getByText( 'Line height' ) );

		expect( await screen.findByText( /Styles > Heading/ ) ).toBeVisible();
	} );

	test( 'renders no breadcrumb tooltip when no source is provided (Global Styles screens)', async () => {
		const user = userEvent.setup();
		// Global Styles screens render panels without an inheritance provider,
		// so the panels resolve `labelTooltip` to undefined and no tooltip is
		// rendered.
		renderItem( {} );

		await user.hover( screen.getByText( 'Line height' ) );

		expect(
			screen.queryByText( /inherited from/i )
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

	test( 'renders a reset dot in the local-override state', () => {
		renderItem( { hasLocalOverride: true, onDeselect: () => {} } );
		expect(
			screen.getByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).toBeVisible();
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
} );
