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
import grid from '../grid';

const GridLayoutInspectorControls = grid.inspectorControls;
const PANEL_ID = 'test-panel';

function renderInspectorControls( props = {} ) {
	return render(
		<ToolsPanel label="Layout" resetAll={ jest.fn() } panelId={ PANEL_ID }>
			<GridLayoutInspectorControls
				clientId={ PANEL_ID }
				layout={ {} }
				onChange={ jest.fn() }
				{ ...props }
			/>
		</ToolsPanel>
	);
}

describe( 'getLayoutStyle', () => {
	it( 'should return only `grid-template-columns` and `container-type` properties if no non-default params are provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr)); container-type: inline-size; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should return only `grid-template-columns` if columnCount property is provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(3, minmax(0, 1fr)); }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { columnCount: 3 },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should return `grid-template-columns` with max() function if both minimumColumnWidth and columnCount are provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(max(min( 12rem, 100%), ( 100% - (1.2rem*2) ) / 3), 1fr)); container-type: inline-size; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { minimumColumnWidth: '12rem', columnCount: 3 },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );

	it( 'should return grid item alignment properties', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr)); container-type: inline-size; justify-items: center; align-items: end; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { justifyContent: 'center', verticalAlignment: 'bottom' },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );

	it( 'should return responsive grid item alignment overrides', () => {
		const expected = `.my-container { justify-items: end; align-items: start; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { type: 'grid' },
			viewportOverrides: {
				justifyContent: 'right',
				verticalAlignment: 'top',
			},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
} );

describe( 'GridLayoutInspectorControls', () => {
	it( 'should not render justification and alignment controls by default', () => {
		renderInspectorControls();

		expect(
			screen.queryByRole( 'radio', { name: 'Justify items center' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'radio', { name: 'Align bottom' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render justification and alignment controls when they have values', () => {
		renderInspectorControls( {
			layout: { justifyContent: 'center', verticalAlignment: 'bottom' },
		} );

		expect(
			screen.getByRole( 'radio', { name: 'Justify items center' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'radio', { name: 'Align bottom' } )
		).toBeInTheDocument();
	} );

	it( 'should update justification and alignment values', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		renderInspectorControls( { onChange } );

		await user.click(
			screen.getByRole( 'button', { name: /Layout options/i } )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show Justification',
			} )
		);
		await user.click(
			screen.getByRole( 'button', { name: /Layout options/i } )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show Alignment',
			} )
		);

		await user.click(
			screen.getByRole( 'radio', { name: 'Justify items center' } )
		);
		await user.click(
			screen.getByRole( 'radio', { name: 'Align bottom' } )
		);

		expect( onChange ).toHaveBeenNthCalledWith( 1, {
			justifyContent: 'center',
		} );
		expect( onChange ).toHaveBeenNthCalledWith( 2, {
			verticalAlignment: 'bottom',
		} );
	} );
} );
