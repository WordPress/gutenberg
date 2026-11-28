import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import BlockPopoverCover from '../cover';

const blocks = new Map< string, HTMLElement >();

vi.mock( import( '../../block-list/use-block-props/use-block-refs' ), () => ( {
	useBlockElement: ( clientId: string ) => blocks.get( clientId ) ?? null,
} ) );

// Like the real popover, sits outside any transformed ancestor at the corner
// of the block's on-screen bounding box.
vi.mock( import( '../index' ), async () => {
	const { forwardRef } = await import( '@wordpress/element' );
	return {
		PrivateBlockPopover: forwardRef<
			HTMLDivElement,
			{ clientId: string; children?: ReactNode }
		>( ( { clientId, children }, ref ) => {
			const rect = blocks.get( clientId )!.getBoundingClientRect();
			return (
				<div
					ref={ ref }
					style={ {
						position: 'fixed',
						left: rect.left,
						top: rect.top,
					} }
				>
					{ children }
				</div>
			);
		} ),
	};
} );

afterEach( () => {
	blocks.clear();
	document.body.replaceChildren();
} );

function nextFrame() {
	return new Promise( ( resolve ) => requestAnimationFrame( resolve ) );
}

function addCorners( element: HTMLElement ) {
	for ( const corner of [ 'top-left', 'bottom-right' ] ) {
		const marker = document.createElement( 'span' );
		marker.dataset.corner = corner;
		const [ vertical, horizontal ] = corner.split( '-' );
		Object.assign( marker.style, {
			position: 'absolute',
			[ vertical ]: '0',
			[ horizontal ]: '0',
		} );
		element.append( marker );
	}
}

function getCorners( element: Element ) {
	return [ 'top-left', 'bottom-right' ].map( ( corner ) => {
		const rect = element
			.querySelector( `[data-corner="${ corner }"]` )!
			.getBoundingClientRect();
		return { x: rect.x, y: rect.y };
	} );
}

function createBlock(
	style: Partial< CSSStyleDeclaration >,
	parentStyle: Partial< CSSStyleDeclaration > = {}
) {
	const parent = document.createElement( 'div' );
	Object.assign( parent.style, { padding: '200px' }, parentStyle );
	const block = document.createElement( 'div' );
	block.id = 'block';
	Object.assign(
		block.style,
		{ position: 'relative', width: '200px', height: '100px' },
		style
	);
	addCorners( block );
	parent.append( block );
	document.body.append( parent );
	blocks.set( 'block', block );
	return block;
}

function Cover() {
	return (
		<BlockPopoverCover clientId="block">
			<div
				className="cover-content"
				ref={ ( element ) => {
					if ( element ) {
						addCorners( element );
					}
				} }
				style={ { position: 'absolute', inset: 0 } }
			/>
		</BlockPopoverCover>
	);
}

async function renderCover() {
	const { container } = await render( <Cover /> );
	return container.querySelector( '.cover-content' )!;
}

// The largest distance between a corner of the cover and the same corner of
// the block.
function getCornerGap( cover: Element, block: Element ) {
	const coverCorners = getCorners( cover );
	return Math.max(
		...getCorners( block ).map( ( { x, y }, index ) =>
			Math.hypot(
				coverCorners[ index ].x - x,
				coverCorners[ index ].y - y
			)
		)
	);
}

describe( 'BlockPopoverCover', () => {
	it( 'matches the size of an untransformed block without a transform', async () => {
		const block = createBlock( {} );
		const cover = await renderCover();
		expect( cover.parentElement ).toHaveStyle( {
			width: '200px',
			height: '100px',
			transform: 'none',
		} );
		expect( getCornerGap( cover, block ) ).toBeLessThan( 0.5 );
	} );

	it.each( [
		[ 'rotated', { rotate: '30deg' } ],
		[ 'scaled', { scale: '0.5' } ],
		[ 'rotated and scaled', { rotate: '-50deg', scale: '1.5 0.75' } ],
		[ 'turned upside down', { rotate: '180deg' } ],
	] )( 'covers a %s block', async ( _, style ) => {
		const block = createBlock( style );
		expect( getCornerGap( await renderCover(), block ) ).toBeLessThan(
			0.5
		);
	} );

	it( 'covers a block inside a rotated and scaled ancestor', async () => {
		const block = createBlock(
			{ rotate: '15deg' },
			{ rotate: '20deg', scale: '0.8' }
		);
		expect( getCornerGap( await renderCover(), block ) ).toBeLessThan(
			0.5
		);
	} );

	it( 'follows a change to the block rotation', async () => {
		const block = createBlock( { rotate: '10deg' } );
		const { container, rerender } = await render( <Cover /> );
		// Past the resize observer's first callback, which reads it anyway.
		await nextFrame();
		await nextFrame();
		block.style.rotate = '45deg';
		await nextFrame();
		// Moves the popover to the new bounding box, as the real one does.
		await rerender( <Cover /> );
		expect(
			getCornerGap( container.querySelector( '.cover-content' )!, block )
		).toBeLessThan( 0.5 );
	} );

	it( 'follows a change to the block size', async () => {
		createBlock( { rotate: '30deg' } );
		const cover = await renderCover();
		// A stylesheet, so the block's own attributes don't change.
		const style = document.createElement( 'style' );
		style.textContent = '#block { width: 300px !important; }';
		document.head.append( style );
		onTestFinished( () => style.remove() );
		await nextFrame();
		await nextFrame();
		expect( cover.parentElement ).toHaveStyle( { width: '300px' } );
	} );
} );
