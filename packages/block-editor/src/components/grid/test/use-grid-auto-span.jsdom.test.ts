import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '../../../store';
import { useBlockElement } from '../../block-list/use-block-props/use-block-refs';
import { useGridAutoSpan } from '../use-grid-auto-span';
import type { GridItemAttributes } from '../types';

vi.mock(
	import( '../../block-list/use-block-props/use-block-refs' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useBlockElement: vi.fn(),
	} )
);

class MockResizeObserver implements ResizeObserver {
	static instances: MockResizeObserver[] = [];
	observe = vi.fn< ResizeObserver[ 'observe' ] >();
	unobserve = vi.fn< ResizeObserver[ 'unobserve' ] >();
	disconnect = vi.fn< ResizeObserver[ 'disconnect' ] >();

	constructor( readonly callback: ResizeObserverCallback ) {
		MockResizeObserver.instances.push( this );
	}

	resize( target: Element ) {
		this.callback(
			[
				{
					target,
					contentRect: new DOMRect(),
					borderBoxSize: [],
					contentBoxSize: [],
					devicePixelContentBoxSize: [],
				},
			],
			this
		);
	}
}

const BLOCK_NAME = 'test/grid-auto-span';

function getItemLayout( clientId: string ) {
	return (
		select( blockEditorStore ).getBlockAttributes( clientId ) as
			GridItemAttributes | undefined
	 )?.style?.layout;
}

function createItemElement( clientId: string, gridElement: HTMLElement ) {
	const element = document.createElement( 'div' );
	element.setAttribute( 'data-block', clientId );
	const content = { width: 50, height: 50 };
	const getSize = (
		property: 'grid-column' | 'grid-row',
		attribute: 'columnSpan' | 'rowSpan'
	) => {
		const temporarySpan = element.style
			.getPropertyValue( property )
			.match( /span (\d+)/ );
		const attributes = select( blockEditorStore ).getBlockAttributes(
			clientId
		) as GridItemAttributes | undefined;
		const span = temporarySpan
			? Number( temporarySpan[ 1 ] )
			: ( attributes?.style?.layout?.[ attribute ] ?? 1 );
		return span * 110 - 10;
	};
	const readScrollWidth = vi.fn( () =>
		Math.max( getSize( 'grid-column', 'columnSpan' ), content.width )
	);
	const readScrollHeight = vi.fn( () =>
		Math.max( getSize( 'grid-row', 'rowSpan' ), content.height )
	);
	// jsdom has no layout engine. Model fixed 100px tracks with 10px gaps,
	// including the hook's temporary placements and any overflowing content.
	Object.defineProperties( element, {
		offsetWidth: { get: () => getSize( 'grid-column', 'columnSpan' ) },
		offsetHeight: { get: () => getSize( 'grid-row', 'rowSpan' ) },
		scrollWidth: { get: readScrollWidth },
		scrollHeight: { get: readScrollHeight },
	} );
	gridElement.append( element );
	return { element, content, readScrollWidth, readScrollHeight };
}

describe( 'useGridAutoSpan', () => {
	let gridElement: HTMLElement;
	let gridClientId: string;
	let childClientId: string;
	let item: ReturnType< typeof createItemElement >;
	let frames: Map< number, FrameRequestCallback >;

	const flushFrame = () => {
		const callbacks = [ ...frames.values() ];
		frames.clear();
		act( () => {
			callbacks.forEach( ( callback ) => callback( 0 ) );
		} );
	};

	beforeAll( () => {
		registerBlockType( BLOCK_NAME, {
			apiVersion: 3,
			title: 'Grid auto span test block',
			category: 'design',
			attributes: {
				layout: { type: 'object' },
				style: { type: 'object' },
				content: { type: 'string', role: 'content' },
			},
		} );
	} );

	beforeEach( async () => {
		MockResizeObserver.instances = [];
		vi.stubGlobal( 'ResizeObserver', MockResizeObserver );
		frames = new Map();
		let nextFrame = 0;
		vi.spyOn( window, 'requestAnimationFrame' ).mockImplementation(
			( callback ) => {
				frames.set( ++nextFrame, callback );
				return nextFrame;
			}
		);
		vi.spyOn( window, 'cancelAnimationFrame' ).mockImplementation(
			( id ) => {
				frames.delete( id );
			}
		);
		const child = createBlock( BLOCK_NAME, {
			content: 'Short content',
			style: { layout: { columnStart: 1, rowStart: 1 } },
		} );
		const grid = createBlock(
			BLOCK_NAME,
			{
				layout: {
					type: 'grid',
					isManualPlacement: true,
					columnCount: 3,
					rowCount: 3,
				},
			},
			[ child ]
		);
		gridClientId = grid.clientId;
		childClientId = child.clientId;
		await dispatch( blockEditorStore ).resetBlocks( [ grid ] );
		await dispatch( blockEditorStore ).updateBlockListSettings(
			gridClientId,
			{}
		);
		gridElement = document.createElement( 'div' );
		gridElement.style.cssText =
			'display: grid; grid-template-columns: 100px 100px 100px; grid-template-rows: 100px 100px 100px; gap: 10px;';
		Object.defineProperty( gridElement, 'clientWidth', { value: 320 } );
		document.body.append( gridElement );
		item = createItemElement( childClientId, gridElement );
		vi.mocked( useBlockElement ).mockReturnValue( gridElement );
	} );

	afterEach( async () => {
		gridElement.remove();
		await act( async () => {
			await dispatch( blockEditorStore ).resetBlocks( [] );
		} );
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	} );

	afterAll( () => {
		unregisterBlockType( BLOCK_NAME );
	} );

	it( 'fits single-cell content with one measurement', () => {
		renderHook( () => useGridAutoSpan( { clientId: gridClientId } ) );
		flushFrame();

		expect( item.readScrollWidth ).toHaveBeenCalledTimes( 1 );
		expect( item.readScrollHeight ).toHaveBeenCalledTimes( 1 );
		expect( getItemLayout( childClientId ) ).toEqual( {
			columnStart: 1,
			rowStart: 1,
		} );
		expect( item.element ).toHaveStyle( { gridColumn: '', gridRow: '' } );
		expect( gridElement ).toHaveStyle( {
			gridTemplateRows: '100px 100px 100px',
			gridAutoRows: '',
		} );
	} );

	it( 'keeps observing blocks as content and grid children change', async () => {
		const mutationObserver = vi.spyOn( window, 'MutationObserver' );
		const { unmount } = renderHook( () =>
			useGridAutoSpan( { clientId: gridClientId } )
		);
		flushFrame();
		const resizeObserver = MockResizeObserver.instances[ 0 ];
		expect( resizeObserver.observe ).toHaveBeenCalledWith( gridElement );
		expect( resizeObserver.observe ).toHaveBeenCalledWith( item.element );
		resizeObserver.observe.mockClear();

		// A pending resize must not reapply overflow from content that was edited.
		item.content.width = 150;
		resizeObserver.resize( item.element );
		item.content.width = 50;
		await act( async () => {
			await dispatch( blockEditorStore ).updateBlockAttributes(
				childClientId,
				{ content: 'Still short content' }
			);
		} );
		flushFrame();
		expect( getItemLayout( childClientId )?.columnSpan ).toBeUndefined();

		item.content.width = 150;
		await act( async () => {
			await dispatch( blockEditorStore ).updateBlockAttributes(
				childClientId,
				{ content: 'Wider content' }
			);
		} );
		flushFrame();
		expect( getItemLayout( childClientId )?.columnSpan ).toBe( 2 );

		item.content.width = 50;
		await act( async () => {
			await dispatch( blockEditorStore ).updateBlockAttributes(
				childClientId,
				{ content: 'Short content again' }
			);
		} );
		flushFrame();
		expect( getItemLayout( childClientId )?.columnSpan ).toBeUndefined();
		expect( resizeObserver.observe ).not.toHaveBeenCalled();

		const newChild = createBlock( BLOCK_NAME, {
			style: { layout: { columnStart: 1, rowStart: 2 } },
		} );
		const newItem = createItemElement( newChild.clientId, gridElement );
		await act( async () => {
			await dispatch( blockEditorStore ).insertBlock(
				newChild,
				1,
				gridClientId
			);
		} );
		flushFrame();
		expect(
			select( blockEditorStore ).getBlockOrder( gridClientId )
		).toEqual( [ childClientId, newChild.clientId ] );
		expect( resizeObserver.observe ).toHaveBeenCalledExactlyOnceWith(
			newItem.element
		);

		item.element.remove();
		await act( async () => {
			await dispatch( blockEditorStore ).removeBlock( childClientId );
		} );
		flushFrame();
		expect( resizeObserver.unobserve ).toHaveBeenCalledExactlyOnceWith(
			item.element
		);

		newItem.content.width = 150;
		resizeObserver.resize( newItem.element );
		flushFrame();
		expect( getItemLayout( newChild.clientId )?.columnSpan ).toBe( 2 );
		expect( MockResizeObserver.instances ).toHaveLength( 1 );
		expect( mutationObserver ).toHaveBeenCalledTimes( 1 );
		expect( resizeObserver.disconnect ).not.toHaveBeenCalled();

		unmount();
		expect( resizeObserver.disconnect ).toHaveBeenCalledTimes( 1 );
		expect( frames.size ).toBe( 0 );
	} );
} );
