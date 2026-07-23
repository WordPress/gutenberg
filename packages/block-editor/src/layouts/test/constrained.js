/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import constrained from '../constrained';

const ConstrainedLayoutInspectorControls = constrained.inspectorControls;
const PANEL_ID = 'test-panel';

function renderInspectorControls( props = {} ) {
	return render(
		<ToolsPanel label="Layout" resetAll={ jest.fn() } panelId={ PANEL_ID }>
			<ConstrainedLayoutInspectorControls
				clientId={ PANEL_ID }
				layout={ {} }
				onChange={ jest.fn() }
				{ ...props }
			/>
		</ToolsPanel>
	);
}

describe( 'getLayoutStyle', () => {
	it( 'should return an empty string if no non-default params are provided', () => {
		const expected = '';

		const result = constrained.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );

	it( 'should fall back to the global block gap when the block has no explicit blockGap', () => {
		const result = constrained.getLayoutStyle( {
			selector: '.my-container',
			layout: { type: 'constrained' },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: true,
			globalBlockGapValue: 'var(--wp--preset--spacing--30)',
		} );

		expect( result ).toContain(
			'.my-container > * { margin-block-start: var(--wp--preset--spacing--30); margin-block-end: 0; }'
		);
	} );

	it( 'should prefer an explicit blockGap over the global block gap fallback', () => {
		const result = constrained.getLayoutStyle( {
			selector: '.my-container',
			layout: { type: 'constrained' },
			style: { spacing: { blockGap: '10px' } },
			blockName: 'test-block',
			hasBlockGapSupport: true,
			globalBlockGapValue: 'var(--wp--preset--spacing--30)',
		} );

		expect( result ).toContain(
			'.my-container > * { margin-block-start: 10px; margin-block-end: 0; }'
		);
		expect( result ).not.toContain( 'var(--wp--preset--spacing--30)' );
	} );

	it( 'should not apply the global block gap fallback for viewport overrides', () => {
		const result = constrained.getLayoutStyle( {
			selector: '.my-container',
			layout: { type: 'constrained' },
			viewportOverrides: { justifyContent: 'left' },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: true,
			globalBlockGapValue: 'var(--wp--preset--spacing--30)',
		} );

		expect( result ).not.toContain( 'var(--wp--preset--spacing--30)' );
	} );

	it( 'should reset constrained sizes when content width is unset in a viewport', () => {
		const result = constrained.getLayoutStyle( {
			selector: '.my-container',
			layout: { type: 'constrained', contentSize: '800px' },
			viewportOverrides: { contentSize: null },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toContain(
			'max-width: var(--wp--style--global--content-size, none);'
		);
		expect( result ).toContain(
			'max-width: var(--wp--style--global--wide-size, none);'
		);
	} );
} );

describe( 'ConstrainedLayoutInspectorControls', () => {
	it( 'renders an unset content width as an empty control value', () => {
		renderInspectorControls( {
			layout: { type: 'constrained', contentSize: null },
			resetLayout: { type: 'constrained', contentSize: '800px' },
		} );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Content width' } )
		).toHaveDisplayValue( '' );
	} );

	it.each( [
		[ 'Content width', 'contentSize' ],
		[ 'Wide width', 'wideSize' ],
	] )(
		'preserves a cleared %s value for viewport layout overrides',
		async ( label, layoutKey ) => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			renderInspectorControls( {
				layout: { type: 'constrained', [ layoutKey ]: '800px' },
				resetLayout: { type: 'constrained', [ layoutKey ]: '800px' },
				onChange,
			} );

			await user.click(
				screen.getByRole( 'button', { name: /Layout options/i } )
			);
			await user.click(
				screen.getByRole( 'menuitemcheckbox', {
					name: `Show ${ label }`,
				} )
			);
			await user.clear(
				screen.getByRole( 'spinbutton', { name: label } )
			);

			const nextLayout = onChange.mock.lastCall?.[ 0 ];
			expect( Object.hasOwn( nextLayout, layoutKey ) ).toBe( true );
			expect( nextLayout[ layoutKey ] ).toBeUndefined();
		}
	);
} );
