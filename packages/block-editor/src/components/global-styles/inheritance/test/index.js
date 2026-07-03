/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
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

describe( 'InheritanceToolsPanelItem inherited label tooltip', () => {
	function renderInheritedItem( label, labelClassName ) {
		return render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					isInherited
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

	function getAnchorText( container ) {
		// eslint-disable-next-line testing-library/no-node-access
		return container.querySelector(
			'.global-styles-inheritance-tooltip-anchor__text'
		)?.textContent;
	}

	function getAnchor( container ) {
		// eslint-disable-next-line testing-library/no-node-access
		return container.querySelector(
			'.global-styles-inheritance-tooltip-anchor'
		);
	}

	test( 'sources the tooltip anchor text from the label prop', () => {
		const { container } = renderInheritedItem(
			'Line height',
			'components-base-control__label'
		);
		expect( getAnchorText( container ) ).toBe( 'Line height' );
	} );

	test( 'keeps the anchor text stable across re-renders (variation switch)', () => {
		// Regression guard: the anchor used to derive its text from the
		// mutated `labelEl.textContent`. Because the anchor is portaled
		// into the label, each re-render re-read and compounded the text
		// ("Line height" -> "Line heightLine height" -> ...). Sourcing the
		// text from the `label` prop keeps it stable.
		const { container, rerender } = renderInheritedItem(
			'Line height',
			'components-base-control__label'
		);
		expect( getAnchorText( container ) ).toBe( 'Line height' );

		// Simulate a repeated variation switch forcing re-renders.
		for ( let i = 0; i < 3; i++ ) {
			rerender(
				<ToolsPanel label="Panel" panelId="panel">
					<InheritanceToolsPanelItem
						isInherited
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

		expect( getAnchorText( container ) ).toBe( 'Line height' );
	} );

	test( 'anchors the tooltip on the color/gradient name label', () => {
		const { container } = renderInheritedItem(
			'Color',
			'block-editor-panel-color-gradient-settings__color-name'
		);
		expect( getAnchorText( container ) ).toBe( 'Color' );
	} );

	test( 'forwards a label click to the control toggle button', () => {
		// Regression guard: the anchor overlays the label and is portaled,
		// so React routes its click through the portal parent tree rather
		// than the DOM-ancestor toggle button. Without forwarding, clicking
		// the label of a toggle-based control (color, background image)
		// would not open the control.
		const onToggle = jest.fn();
		const { container } = render(
			<ToolsPanel label="Panel" panelId="panel">
				<InheritanceToolsPanelItem
					isInherited
					label="Color"
					panelId="panel"
					isShownByDefault
					hasValue={ () => false }
				>
					<button type="button" onClick={ onToggle }>
						<span className="components-base-control__label">
							Color
						</span>
					</button>
				</InheritanceToolsPanelItem>
			</ToolsPanel>
		);

		const anchor = getAnchor( container );
		fireEvent.click( anchor );
		expect( onToggle ).toHaveBeenCalledTimes( 1 );
	} );
} );
