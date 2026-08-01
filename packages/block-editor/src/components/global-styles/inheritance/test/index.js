/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getInheritanceProps, InheritanceToolsPanelItem } from '../';

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
