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
import { act } from '@testing-library/react';
import { renderHook } from 'vitest-browser-react';
import { dispatch, select } from '@wordpress/data';
import {
	createBlock,
	parse,
	registerBlockType,
	serialize,
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
		const gridStyle = window.getComputedStyle( gridElement );
		const trackSize = parseFloat(
			attribute === 'columnSpan'
				? gridStyle.gridTemplateColumns
				: gridStyle.gridTemplateRows
		);
		return span * ( trackSize + 10 ) - 10;
	};
	const readScrollWidth = vi.fn( () =>
		Math.max( getSize( 'grid-column', 'columnSpan' ), content.width )
	);
	const readScrollHeight = vi.fn( () =>
		Math.max( getSize( 'grid-row', 'rowSpan' ), content.height )
	);
	// Use the grid's track sizes with 10px gaps so measurement counts and
	// overflow notifications are deterministic across temporary placements.
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

	const reloadGrid = async ( unmount: () => Promise< void > ) => {
		const savedItems = serialize(
			select( blockEditorStore ).getBlocks( gridClientId )
		);
		const gridAttributes =
			select( blockEditorStore ).getBlockAttributes( gridClientId );
		const content = item.content;
		await unmount();

		// Parsing saved blocks generates new client IDs, as a page reload does.
		const children = parse( savedItems );
		const grid = createBlock( BLOCK_NAME, gridAttributes ?? {}, children );
		gridClientId = grid.clientId;
		childClientId = children[ 0 ].clientId;
		await act( async () => {
			await dispatch( blockEditorStore ).resetBlocks( [ grid ] );
			await dispatch( blockEditorStore ).updateBlockListSettings(
				gridClientId,
				{}
			);
		} );
		gridElement.replaceChildren();
		item = createItemElement( childClientId, gridElement );
		Object.assign( item.content, content );
		return renderHook( () =>
			useGridAutoSpan( { clientId: gridClientId } )
		);
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
		Object.defineProperty( gridElement, 'clientWidth', {
			value: 320,
			configurable: true,
		} );
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

	it( 'fits single-cell content with one measurement', async () => {
		await renderHook( () => useGridAutoSpan( { clientId: gridClientId } ) );
		flushFrame();

		expect( item.readScrollWidth ).toHaveBeenCalledTimes( 1 );
		expect( item.readScrollHeight ).toHaveBeenCalledTimes( 1 );
		expect( getItemLayout( childClientId ) ).toEqual( {
			columnStart: 1,
			rowStart: 1,
		} );
		expect( item.element ).toHaveStyle( {
			gridColumnStart: 'auto',
			gridColumnEnd: 'auto',
			gridRowStart: 'auto',
			gridRowEnd: 'auto',
		} );
		expect( gridElement ).toHaveStyle( {
			gridTemplateRows: '100px 100px 100px',
			gridAutoRows: 'auto',
		} );
	} );

	it.each( [
		{
			axis: 'column',
			span: 'columnSpan',
			dimension: 'width',
		},
		{
			axis: 'row',
			span: 'rowSpan',
			dimension: 'height',
		},
	] as const )(
		'preserves a saved $axis span when content overflows',
		async ( { span, dimension } ) => {
			item.content[ dimension ] = 250;
			let { unmount } = await renderHook( () =>
				useGridAutoSpan( { clientId: gridClientId } )
			);
			flushFrame();
			flushFrame();
			expect( getItemLayout( childClientId )?.[ span ] ).toBe( 3 );

			await act( async () => {
				await dispatch( blockEditorStore ).updateBlockAttributes(
					childClientId,
					{
						style: {
							layout: {
								...getItemLayout( childClientId ),
								[ span ]: 1,
							},
						},
					}
				);
			} );
			flushFrame();
			flushFrame();
			expect( getItemLayout( childClientId )?.[ span ] ).toBe( 1 );
			const savedLayout = getItemLayout( childClientId );

			const switchPreviews = async () => {
				for ( const [ columnCount, trackSize ] of [
					[ 1, 320 ],
					[ 3, 100 ],
				] ) {
					await unmount();
					gridElement.style.gridTemplateColumns = `repeat(${ columnCount }, ${ trackSize }px)`;
					gridElement.style.gridTemplateRows = `repeat(3, ${ trackSize }px)`;
					const hook = await renderHook( () =>
						useGridAutoSpan( { clientId: gridClientId } )
					);
					unmount = hook.unmount;
					flushFrame();
					flushFrame();
					expect( getItemLayout( childClientId ) ).toEqual(
						savedLayout
					);
				}
			};

			// The same client IDs and sizing state survive preview remounts.
			await switchPreviews();
			const reloadedHook = await reloadGrid( unmount );
			unmount = reloadedHook.unmount;
			flushFrame();
			flushFrame();
			expect( getItemLayout( childClientId ) ).toEqual( savedLayout );
			await switchPreviews();

			// Initial resize notifications must also preserve the saved spans.
			const resizeObserver = MockResizeObserver.instances.at( -1 )!;
			resizeObserver.resize( gridElement );
			resizeObserver.resize( item.element );
			flushFrame();
			flushFrame();
			expect( getItemLayout( childClientId ) ).toEqual( savedLayout );

			// Editing content resumes automatic sizing, including after reload.
			await act( async () => {
				await dispatch( blockEditorStore ).updateBlockAttributes(
					childClientId,
					{ content: 'Changed overflowing content' }
				);
			} );
			flushFrame();
			flushFrame();
			expect( getItemLayout( childClientId )?.[ span ] ).toBe( 3 );
		}
	);

	it( 'continues adjusting automatic spans after reload', async () => {
		item.content.width = 150;
		item.content.height = 150;
		const { unmount } = await renderHook( () =>
			useGridAutoSpan( { clientId: gridClientId } )
		);
		flushFrame();
		flushFrame();
		expect( getItemLayout( childClientId ) ).toMatchObject( {
			columnSpan: 2,
			rowSpan: 2,
		} );

		await reloadGrid( unmount );
		flushFrame();
		flushFrame();
		const resizeObserver = MockResizeObserver.instances.at( -1 )!;
		for ( const [ trackSize, gridWidth, expectedSpan ] of [
			[ 50, 320, 3 ],
			[ 200, 620, 1 ],
		] ) {
			gridElement.style.gridTemplateColumns = `repeat(3, ${ trackSize }px)`;
			gridElement.style.gridTemplateRows = `repeat(3, ${ trackSize }px)`;
			Object.defineProperty( gridElement, 'clientWidth', {
				value: gridWidth,
			} );
			resizeObserver.resize( gridElement );
			flushFrame();
			flushFrame();
			expect( getItemLayout( childClientId ) ).toMatchObject( {
				columnSpan: expectedSpan,
				rowSpan: expectedSpan,
			} );
		}
	} );

	it( 'keeps observing blocks as content and grid children change', async () => {
		const observeMutations = vi.spyOn(
			MutationObserver.prototype,
			'observe'
		);
		const { unmount } = await renderHook( () =>
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
		expect(
			observeMutations.mock.calls.filter(
				( [ target ] ) => target === gridElement
			)
		).toHaveLength( 1 );
		expect( resizeObserver.disconnect ).not.toHaveBeenCalled();

		await unmount();
		expect( resizeObserver.disconnect ).toHaveBeenCalledTimes( 1 );
		expect( frames.size ).toBe( 0 );
	} );
} );
