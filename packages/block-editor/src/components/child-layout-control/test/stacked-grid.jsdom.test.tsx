import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import type { ComponentType } from 'react';
import ChildLayoutControlSource from '../';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

// The component is written in JavaScript, with JSDoc types TypeScript can't
// use as a component.
const ChildLayoutControl = ChildLayoutControlSource as unknown as ComponentType<
	Record< string, unknown >
>;

const experimentWindow = window as Window & {
	__experimentalEnableGridInteractivity?: boolean;
};

function getStyle( clientId: string ) {
	const attributes = select( blockEditorStore ).getBlockAttributes(
		clientId
	) as { style?: Record< string, unknown > } | null;
	return attributes?.style;
}

const gridLayout = {
	type: 'grid',
	isManualPlacement: true,
	columnCount: 3,
	rowCount: 2,
};

describe( 'ChildLayoutControl in a grid stacked on mobile', () => {
	let originalExperiment: boolean | undefined;
	let first: ReturnType< typeof createBlock >;
	let second: ReturnType< typeof createBlock >;
	let grid: ReturnType< typeof createBlock >;

	beforeAll( () => {
		registerBlockType( 'test/grid', {
			apiVersion: 3,
			title: 'Grid',
			category: 'design',
			attributes: {
				layout: { type: 'object' },
				style: { type: 'object' },
			},
			edit: () => null,
			save: () => null,
		} );
		registerBlockType( 'test/item', {
			apiVersion: 3,
			title: 'Item',
			category: 'design',
			attributes: { style: { type: 'object' } },
			edit: () => null,
			save: () => null,
		} );
		return () => {
			unregisterBlockType( 'test/grid' );
			unregisterBlockType( 'test/item' );
		};
	} );

	beforeEach( () => {
		originalExperiment =
			experimentWindow.__experimentalEnableGridInteractivity;
		experimentWindow.__experimentalEnableGridInteractivity = true;
		first = createBlock( 'test/item', {
			style: { layout: { columnStart: 2, rowStart: 1, rowSpan: 2 } },
		} );
		second = createBlock( 'test/item', {
			style: { layout: { columnStart: 1, rowStart: 1 } },
		} );
		grid = createBlock( 'test/grid', { layout: gridLayout }, [
			first,
			second,
		] );
		dispatch( blockEditorStore ).resetBlocks( [ grid ] );
		unlock( dispatch( blockEditorStore ) ).setStyleStateViewport(
			'@mobile'
		);
	} );

	afterEach( () => {
		act( () => {
			unlock( dispatch( blockEditorStore ) ).setStyleStateViewport(
				'default'
			);
		} );
		experimentWindow.__experimentalEnableGridInteractivity =
			originalExperiment;
	} );

	function showControl() {
		const onChange = vi.fn();
		render(
			<ToolsPanel
				label="Dimensions"
				resetAll={ vi.fn() }
				panelId={ second.clientId }
			>
				<ChildLayoutControl
					// The block has no mobile layout yet.
					value={ {} }
					onChange={ onChange }
					parentLayout={ gridLayout }
					isShownByDefault
					panelId={ second.clientId }
					showGridSpanDefaults={ false }
				/>
			</ToolsPanel>
		);
		return onChange;
	}

	it( 'shows the place of the block in the stack', () => {
		showControl();

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( 3 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( 1 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Column' } )
		).toHaveValue( 1 );
		expect( screen.getByRole( 'spinbutton', { name: 'Row' } ) ).toHaveValue(
			3
		);
	} );

	it( 'unstacks the grid and keeps the stacked placement of the edited block', async () => {
		const user = userEvent.setup();
		const onChange = showControl();

		const columnSpan = screen.getByRole( 'spinbutton', {
			name: 'Column span',
		} );
		// Replace the value in one edit. After it, the grid has its own
		// mobile layout, and later edits go through `onChange` as usual.
		await user.tripleClick( columnSpan );
		await user.keyboard( '2' );

		expect( onChange ).not.toHaveBeenCalled();
		expect( getStyle( second.clientId ) ).toEqual( {
			layout: { columnStart: 1, rowStart: 1 },
			'@mobile': {
				layout: {
					columnStart: 1,
					columnSpan: 2,
					rowStart: 3,
					rowSpan: 1,
				},
			},
		} );
		expect( getStyle( first.clientId ) ).toEqual( {
			layout: { columnStart: 2, rowStart: 1, rowSpan: 2 },
			'@mobile': {
				layout: {
					columnStart: 1,
					columnSpan: 3,
					rowStart: 1,
					rowSpan: 2,
				},
			},
		} );
		expect( getStyle( grid.clientId ) ).toEqual( {
			'@mobile': {
				layout: { stackOnMobile: false, columnCount: 3, rowCount: 3 },
			},
		} );
	} );
} );
