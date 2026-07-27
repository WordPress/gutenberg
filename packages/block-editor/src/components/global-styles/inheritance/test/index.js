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
import {
	getInheritanceProps,
	getTranslatedBreadcrumb,
	getOverrideTooltipText,
	getCommonOverrideTooltipText,
	InheritanceOverrideIndicator,
	InheritanceToolsPanelItem,
} from '../';

// Source-map entries as produced by `resolveStyle`. Block titles are not
// registered in this test, so `getBlockType` returns undefined and the block
// title falls back to the slug.
const ROOT_SOURCE = {
	layer: 'root',
	breadcrumb: [ 'styles' ],
	blockName: null,
	variation: null,
};
const BLOCK_SOURCE = {
	layer: 'block',
	breadcrumb: [ 'styles', 'blocks', 'blockName' ],
	blockName: 'core/heading',
	variation: null,
};
const VARIATION_SOURCE = {
	layer: 'blockVariation',
	breadcrumb: [
		'styles',
		'blocks',
		'blockName',
		'variations',
		'variationName',
	],
	blockName: 'core/heading',
	variation: 'plain',
};
const BLOCK_STYLES = [ { name: 'plain', label: 'Plain' } ];

describe( 'InheritanceOverrideIndicator', () => {
	test( 'renders a focus-reachable indicator labelled for the override', () => {
		render( <InheritanceOverrideIndicator /> );
		expect(
			screen.getByRole( 'img', { name: 'Overrides inherited styles' } )
		).toBeVisible();
	} );

	test( 'applies a slot className for custom-control positioning', () => {
		render( <InheritanceOverrideIndicator className="my-slot-class" /> );
		expect(
			screen.getByRole( 'img', { name: 'Overrides inherited styles' } )
		).toHaveClass( 'my-slot-class' );
	} );

	test( 'labels the indicator with the breadcrumb when given sources', () => {
		render(
			<InheritanceOverrideIndicator
				overrideSources={ [ BLOCK_SOURCE ] }
			/>
		);
		expect(
			screen.getByRole( 'img', {
				name: 'Overrides inherited styles from Blocks › core/heading',
			} )
		).toBeVisible();
	} );

	test( 'falls back to the bare label for a root-sourced (default) override', () => {
		render(
			<InheritanceOverrideIndicator overrideSources={ [ ROOT_SOURCE ] } />
		);
		expect(
			screen.getByRole( 'img', { name: 'Overrides inherited styles' } )
		).toBeVisible();
	} );

	test( 'falls back to the bare label when no source resolves', () => {
		render( <InheritanceOverrideIndicator overrideSources={ [] } /> );
		expect(
			screen.getByRole( 'img', { name: 'Overrides inherited styles' } )
		).toBeVisible();
	} );
} );

describe( 'override tooltip breadcrumb helpers', () => {
	test( 'getTranslatedBreadcrumb drops the root Styles node and translates the rest', () => {
		// Root-only resolves to no path (it is the global default).
		expect( getTranslatedBreadcrumb( ROOT_SOURCE ) ).toBeUndefined();
		expect( getTranslatedBreadcrumb( BLOCK_SOURCE ) ).toBe(
			'Blocks › core/heading'
		);
		expect(
			getTranslatedBreadcrumb( VARIATION_SOURCE, BLOCK_STYLES )
		).toBe( 'Blocks › core/heading › Variations › Plain' );
	} );

	test( 'getTranslatedBreadcrumb falls back to the variation slug without blockStyles', () => {
		expect( getTranslatedBreadcrumb( VARIATION_SOURCE ) ).toBe(
			'Blocks › core/heading › Variations › plain'
		);
	} );

	test( 'getTranslatedBreadcrumb returns undefined without a breadcrumb', () => {
		expect( getTranslatedBreadcrumb( undefined ) ).toBeUndefined();
		expect( getTranslatedBreadcrumb( { layer: 'root' } ) ).toBeUndefined();
	} );

	test( 'getOverrideTooltipText frames the breadcrumb with "from"', () => {
		expect( getOverrideTooltipText( BLOCK_SOURCE ) ).toBe(
			'Overrides inherited styles from Blocks › core/heading'
		);
	} );

	test( 'getOverrideTooltipText returns undefined for a root-only source', () => {
		expect( getOverrideTooltipText( ROOT_SOURCE ) ).toBeUndefined();
	} );

	test( 'getCommonOverrideTooltipText uses one breadcrumb when all sources match', () => {
		expect(
			getCommonOverrideTooltipText( [
				BLOCK_SOURCE,
				{ ...BLOCK_SOURCE },
			] )
		).toBe( 'Overrides inherited styles from Blocks › core/heading' );
	} );

	test( 'getCommonOverrideTooltipText summarizes mixed sources', () => {
		expect(
			getCommonOverrideTooltipText( [ BLOCK_SOURCE, VARIATION_SOURCE ] )
		).toBe( 'Overrides inherited styles from multiple sources' );
	} );

	test( 'getCommonOverrideTooltipText returns undefined with no sources', () => {
		expect( getCommonOverrideTooltipText( [] ) ).toBeUndefined();
		expect( getCommonOverrideTooltipText( undefined ) ).toBeUndefined();
	} );
} );

describe( 'getInheritanceProps', () => {
	test( 'returns explicit false state when neither flag is set', () => {
		expect( getInheritanceProps( false, false ) ).toEqual( {
			isInherited: false,
			hasLocalOverride: false,
		} );
	} );

	test( 'returns no className in the inherited-only state', () => {
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

	test( 'returns just the base className in the inherited-only state', () => {
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

	test( 'applies no inheritance treatment class in the inherited state', () => {
		renderInheritedItem( 'Line height', 'components-base-control__label' );
		const label = screen.getByText( 'Line height' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			label.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			label.closest( '.has-local-override-from-global-styles' )
		).toBeNull();
	} );

	test( 'does not render an override indicator in the inherited state', () => {
		renderInheritedItem( 'Line height', 'components-base-control__label' );
		expect(
			screen.queryByRole( 'img', {
				name: 'Overrides inherited styles',
			} )
		).not.toBeInTheDocument();
	} );
} );

describe( 'InheritanceToolsPanelItem local-override indicator', () => {
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

	test( 'renders the override indicator', () => {
		renderItem( {
			hasLocalOverride: true,
			onDeselect: () => {},
		} );
		expect(
			screen.getByRole( 'img', {
				name: 'Overrides inherited styles',
			} )
		).toBeVisible();
	} );

	test( 'the indicator is a plain sibling, not nested inside the label', () => {
		renderItem( {
			hasLocalOverride: true,
			onDeselect: () => {},
		} );
		const indicator = screen.getByRole( 'img', {
			name: 'Overrides inherited styles',
		} );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			indicator.closest( '.components-base-control__label' )
		).toBeNull();
	} );

	test( 'does not render the indicator when showLocalOverrideActionsInLabel is false', () => {
		// Color/background render their own reset control next to a custom
		// toggle, so the item must not render a second indicator.
		renderItem( {
			hasLocalOverride: true,
			showLocalOverrideActionsInLabel: false,
			onDeselect: () => {},
		} );
		expect(
			screen.queryByRole( 'img', {
				name: 'Overrides inherited styles',
			} )
		).not.toBeInTheDocument();
	} );

	test( 'does not offset the indicator by default', () => {
		renderItem( { hasLocalOverride: true, onDeselect: () => {} } );
		const indicator = screen.getByRole( 'img', {
			name: 'Overrides inherited styles',
		} );
		const affordance =
			// eslint-disable-next-line testing-library/no-node-access
			indicator.closest( '.global-styles-inheritance-affordance' );
		expect( affordance ).not.toHaveClass(
			'global-styles-inheritance-affordance--offset-toggle'
		);
	} );

	test( 'offsets the indicator when the control has an inline-end toggle', () => {
		renderItem( {
			hasLocalOverride: true,
			hasInlineEndToggle: true,
			onDeselect: () => {},
		} );
		const indicator = screen.getByRole( 'img', {
			name: 'Overrides inherited styles',
		} );
		const affordance =
			// eslint-disable-next-line testing-library/no-node-access
			indicator.closest( '.global-styles-inheritance-affordance' );
		expect( affordance ).toHaveClass(
			'global-styles-inheritance-affordance--offset-toggle'
		);
	} );
} );
