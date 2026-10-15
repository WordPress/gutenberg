import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { GapVisualizer } from '../index';
import { useBlockElement } from '../../../components/block-list/use-block-props/use-block-refs';
import { measureFlexLayout } from '../measure-flex-layout';
import { computeFlexGapRects } from '../compute-flex-gap-rects';

vi.mock(
	import( '../../../components/block-list/use-block-props/use-block-refs' ),
	() => ( {
		useBlockElement: vi.fn(),
	} )
);

vi.mock( import( '../../../components/block-popover/cover' ), () => ( {
	default: ( { children } ) =>
		createElement(
			'div',
			{ 'data-testid': 'block-popover-cover' },
			children
		),
} ) );

vi.mock( import( '../measure-flex-layout' ), () => ( {
	measureFlexLayout: vi.fn(),
} ) );

vi.mock( import( '../compute-flex-gap-rects' ), () => ( {
	computeFlexGapRects: vi.fn(),
} ) );

describe( 'GapVisualizer component', () => {
	let containerElement;
	let mutationCallbacks = [];
	let resizeCallback;
	let mutationDisconnectSpy;
	let resizeDisconnectSpy;

	beforeEach( () => {
		vi.clearAllMocks();
		mutationCallbacks = [];

		containerElement = document.createElement( 'div' );
		containerElement.style.display = 'flex';
		document.body.appendChild( containerElement );

		measureFlexLayout.mockReturnValue( { boxes: [], config: {} } );
		computeFlexGapRects.mockReturnValue( [] );

		mutationDisconnectSpy = vi.fn();
		resizeDisconnectSpy = vi.fn();

		global.MutationObserver = vi.fn( function ( cb ) {
			mutationCallbacks.push( cb );
			this.observe = vi.fn();
			this.disconnect = mutationDisconnectSpy;
		} );

		global.ResizeObserver = vi.fn( function ( cb ) {
			resizeCallback = cb;
			this.observe = vi.fn();
			this.disconnect = resizeDisconnectSpy;
		} );
	} );

	afterEach( () => {
		containerElement?.remove();
		vi.restoreAllMocks();
	} );

	async function flushMicrotasks() {
		await act( async () => {
			await Promise.resolve();
		} );
	}

	it( 'renders nothing when blockElement is null', async () => {
		useBlockElement.mockReturnValue( null );

		const { container } = render(
			createElement( GapVisualizer, { clientId: 'block-1' } )
		);
		await flushMicrotasks();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing for unsupported computed display like table or contents', async () => {
		containerElement.style.display = 'table';
		useBlockElement.mockReturnValue( containerElement );

		const { container } = render(
			createElement( GapVisualizer, { clientId: 'block-1' } )
		);
		await flushMicrotasks();
		expect( container ).toBeEmptyDOMElement();
		expect( computeFlexGapRects ).not.toHaveBeenCalled();
	} );

	it( 'dispatches to flex engine when display is flex', async () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects.mockReturnValue( [
			{ left: 10, top: 0, width: 20, height: 40, type: 'column' },
		] );

		render( createElement( GapVisualizer, { clientId: 'block-1' } ) );
		await flushMicrotasks();

		expect( measureFlexLayout ).toHaveBeenCalled();
		expect( computeFlexGapRects ).toHaveBeenCalled();
		expect(
			screen.getByTestId( 'block-popover-cover' )
		).toBeInTheDocument();
	} );

	it( 'renders nothing when display is grid, block, or non-flex', async () => {
		containerElement.style.display = 'grid';
		useBlockElement.mockReturnValue( containerElement );

		const { container } = render(
			createElement( GapVisualizer, { clientId: 'block-1' } )
		);
		await flushMicrotasks();

		expect(
			screen.queryByTestId( 'block-popover-cover' )
		).not.toBeInTheDocument();
		expect( container ).toBeEmptyDOMElement();

		containerElement.style.display = 'block';
		await flushMicrotasks();
		expect(
			screen.queryByTestId( 'block-popover-cover' )
		).not.toBeInTheDocument();
	} );

	it( 'coalesces multiple rapid update requests into a single microtask', async () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects.mockReturnValue( [
			{ left: 0, top: 0, width: 10, height: 10, type: 'column' },
		] );

		render( createElement( GapVisualizer, { clientId: 'block-1' } ) );
		await flushMicrotasks();

		const initialCalls = measureFlexLayout.mock.calls.length;

		// Fire multiple observer callbacks synchronously in the same task.
		for ( const cb of mutationCallbacks ) {
			cb();
			cb();
		}

		// Microtask hasn't flushed yet, no extra measurement calls.
		expect( measureFlexLayout ).toHaveBeenCalledTimes( initialCalls );

		// Flush microtasks, exactly ONE coalesced measurement runs.
		await flushMicrotasks();
		expect( measureFlexLayout ).toHaveBeenCalledTimes( initialCalls + 1 );
	} );

	it( 'recomputes when ResizeObserver triggers', async () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects
			.mockReturnValueOnce( [
				{ left: 0, top: 0, width: 10, height: 10, type: 'row' },
			] )
			.mockReturnValueOnce( [
				{ left: 0, top: 0, width: 20, height: 10, type: 'row' },
			] );

		render( createElement( GapVisualizer, { clientId: 'block-1' } ) );
		await flushMicrotasks();

		resizeCallback();
		await flushMicrotasks();

		const rect = screen.getByTestId( 'block-editor-gap-visualizer-rect' );
		expect( rect ).toHaveStyle( { width: '20px' } );
	} );

	it( 'recomputes when layout style element content mutates', async () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects
			.mockReturnValueOnce( [
				{ left: 0, top: 0, width: 10, height: 10, type: 'column' },
			] )
			.mockReturnValueOnce( [
				{ left: 0, top: 0, width: 30, height: 10, type: 'column' },
			] );

		render( createElement( GapVisualizer, { clientId: 'block-1' } ) );
		await flushMicrotasks();

		const initialCalls = measureFlexLayout.mock.calls.length;

		// Trigger style element mutation observer callback.
		for ( const cb of mutationCallbacks ) {
			cb();
		}

		// Microtask hasn't flushed yet, no extra measurement calls.
		expect( measureFlexLayout ).toHaveBeenCalledTimes( initialCalls );

		// Flush microtasks scheduled by style mutation.
		await flushMicrotasks();
		expect( measureFlexLayout ).toHaveBeenCalledTimes( initialCalls + 1 );
	} );

	it( 'skips DOM write when computed rects are deeply equal within 0.01px', async () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects.mockReturnValue( [
			{
				left: 10.002,
				top: 5.001,
				width: 20.003,
				height: 15.004,
				type: 'column',
			},
		] );

		render( createElement( GapVisualizer, { clientId: 'block-1' } ) );
		await flushMicrotasks();

		const initialRect = screen.getByTestId(
			'block-editor-gap-visualizer-rect'
		);
		expect( initialRect ).toBeInTheDocument();

		// Set rects differing by < 0.01px and trigger mutation callback to recompute.
		computeFlexGapRects.mockReturnValue( [
			{
				left: 10.004,
				top: 5.002,
				width: 20.001,
				height: 15.002,
				type: 'column',
			},
		] );

		for ( const cb of mutationCallbacks ) {
			cb();
		}
		await flushMicrotasks();

		const rectAfterMutation = screen.getByTestId(
			'block-editor-gap-visualizer-rect'
		);
		expect( rectAfterMutation ).toBe( initialRect );
	} );

	it( 'cleans up observers on unmount', () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects.mockReturnValue( [
			{ left: 0, top: 0, width: 10, height: 10, type: 'row' },
		] );

		const { unmount } = render(
			createElement( GapVisualizer, { clientId: 'block-1' } )
		);
		unmount();

		expect( mutationDisconnectSpy ).toHaveBeenCalled();
		expect( resizeDisconnectSpy ).toHaveBeenCalled();
	} );

	it( 'keeps updated values without snapping back when React re-renders with constant rect count', async () => {
		containerElement.style.display = 'flex';
		useBlockElement.mockReturnValue( containerElement );
		computeFlexGapRects.mockReturnValue( [
			{ left: 10, top: 0, width: 20, height: 50, type: 'column' },
		] );

		const { rerender } = render(
			createElement( GapVisualizer, { clientId: 'block-1' } )
		);
		await flushMicrotasks();

		const rect = screen.getByTestId( 'block-editor-gap-visualizer-rect' );
		expect( rect ).toHaveStyle( { width: '20px', left: '10px' } );

		// Simulate imperative update with unchanged count (1 rect), new coordinates.
		computeFlexGapRects.mockReturnValue( [
			{ left: 15, top: 0, width: 40, height: 50, type: 'column' },
		] );

		for ( const cb of mutationCallbacks ) {
			cb();
		}
		await flushMicrotasks();

		// Check that imperative update changed the DOM element styles directly.
		expect( rect ).toHaveStyle( { width: '40px', left: '15px' } );

		// Now force an arbitrary React re-render of GapVisualizer.
		rerender( createElement( GapVisualizer, { clientId: 'block-1' } ) );

		// The rect must KEEP the updated values and NOT snap back to initial 20px.
		expect( rect ).toHaveStyle( { width: '40px', left: '15px' } );
	} );

	it( 'measures a real flex DOM with no engine mocks through GapVisualizer', async () => {
		const actualMeasureFlex = await vi.importActual(
			'../measure-flex-layout'
		);
		const actualComputeFlex = await vi.importActual(
			'../compute-flex-gap-rects'
		);
		measureFlexLayout.mockImplementation(
			actualMeasureFlex.measureFlexLayout
		);
		computeFlexGapRects.mockImplementation(
			actualComputeFlex.computeFlexGapRects
		);

		containerElement.style.display = 'flex';
		containerElement.style.columnGap = '20px';
		containerElement.style.rowGap = '0px';
		containerElement.style.flexDirection = 'row';
		containerElement.style.flexWrap = 'nowrap';
		containerElement.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			right: 220,
			bottom: 50,
			width: 220,
			height: 50,
		} );

		const child1 = document.createElement( 'div' );
		child1.getBoundingClientRect = () => ( {
			left: 0,
			top: 0,
			right: 100,
			bottom: 50,
			width: 100,
			height: 50,
		} );
		containerElement.appendChild( child1 );

		const child2 = document.createElement( 'div' );
		child2.getBoundingClientRect = () => ( {
			left: 120,
			top: 0,
			right: 220,
			bottom: 50,
			width: 100,
			height: 50,
		} );
		containerElement.appendChild( child2 );

		useBlockElement.mockReturnValue( containerElement );

		render( createElement( GapVisualizer, { clientId: 'block-1' } ) );
		await flushMicrotasks();

		const rect = screen.getByTestId( 'block-editor-gap-visualizer-rect' );
		expect( rect ).toBeInTheDocument();
		expect( rect ).toHaveStyle( {
			left: '100px',
			top: '0px',
			width: '20px',
			height: '50px',
		} );
	} );
} );
