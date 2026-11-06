import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import {
	createBlock,
	getBlockTypes,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
// @ts-expect-error Block Library does not provide public types yet.
import { registerCoreBlocks } from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';

type ResizeCallbacks = {
	onResizeStart: ( height: number ) => void;
	onResize: ( height: number ) => void;
	onResizeStop: ( height: number ) => void;
};

const resize = vi.hoisted( () => ( {
	current: null as ResizeCallbacks | null,
} ) );
let unmountEditor: ( () => void | Promise< void > ) | undefined;

function getResizeCallbacks() {
	if ( ! resize.current ) {
		throw new Error( 'The selected Cover has not rendered its resizer.' );
	}
	return resize.current;
}

// Exercise Cover's resize callbacks with a real block and iframe. Pointer
// handling belongs to ResizableBox; the values it reports are CSS pixels.
vi.mock( import( '../edit/resizable-cover-popover' ), () => ( {
	default: ( props ) => {
		resize.current = props;
		return <></>;
	},
} ) );

const {
	ExperimentalBlockCanvas: BlockCanvas,
	ExperimentalBlockEditorProvider: BlockEditorProvider,
} = unlock( blockEditorPrivateApis );

async function setup( minHeightUnit: string | undefined, minHeight = 10 ) {
	const block = createBlock( 'core/cover', {
		overlayColor: 'black',
		minHeight,
		minHeightUnit,
	} );
	function TestEditor() {
		const [ blocks, setBlocks ] = useState( [ block ] );
		return (
			<BlockEditorProvider
				value={ blocks }
				onInput={ setBlocks }
				onChange={ setBlocks }
				useSubRegistry={ false }
				settings={ {
					colors: [
						{ name: 'Black', slug: 'black', color: '#000000' },
					],
				} }
			>
				<BlockCanvas height="600px" />
			</BlockEditorProvider>
		);
	}
	const { unmount } = await render( <TestEditor /> );
	unmountEditor = unmount;
	let cover: HTMLElement | undefined;
	await waitFor( () => {
		// The canvas is in a different document from the resize popover.
		const iframe =
			screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
		expect( iframe?.contentDocument?.body ).toBeTruthy();
		if ( ! iframe.contentDocument?.body ) {
			throw new Error( 'The canvas has not loaded.' );
		}
		cover = within( iframe.contentDocument.body ).getByLabelText(
			'Block: Cover'
		);
	} );
	if ( ! cover ) {
		throw new Error( 'The Cover has not rendered.' );
	}
	const view = cover.ownerDocument.defaultView;
	if ( ! view ) {
		throw new Error( 'The canvas window is unavailable.' );
	}
	cover.ownerDocument.documentElement.style.fontSize = '20px';
	cover.style.fontSize = '25px';
	// Content can make the rendered height larger than the minimum. It must
	// never become the conversion factor for that minimum's CSS unit.
	cover.style.height = '700px';
	await act( async () => {
		dispatch( blockEditorStore ).selectBlock( block.clientId );
	} );
	await waitFor( () => expect( resize.current ).not.toBeNull() );
	return {
		cover,
		view,
		getAttributes: () =>
			select( blockEditorStore ).getBlockAttributes( block.clientId ),
	};
}

describe( 'Cover resize units', () => {
	beforeEach( () => {
		resize.current = null;
		registerCoreBlocks();
	} );

	afterEach( async () => {
		// The iframe must finish unmounting before unregistering its blocks.
		await act( async () => {
			await unmountEditor?.();
		} );
		unmountEditor = undefined;
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
		select( richTextStore )
			.getFormatTypes()
			.forEach( ( { name } ) => unregisterFormatType( name ) );
	} );

	test.each( [ 'px', 'em', 'rem', 'vw', 'vh' ] as const )(
		'preserves %s while resizing in the canvas document',
		async ( unit ) => {
			const { cover, view, getAttributes } = await setup( unit );
			expect( view ).not.toBe( window );
			const pixelsPerUnit = {
				px: 1,
				em: 25,
				rem: 20,
				vw: view.innerWidth / 100,
				vh: view.innerHeight / 100,
			}[ unit ];
			const callbacks = getResizeCallbacks();
			await act( async () => {
				callbacks.onResizeStart( 300 );
				callbacks.onResize( 300 );
			} );
			expect( getAttributes() ).toMatchObject( {
				minHeightUnit: unit,
				minHeight: Number( ( 300 / pixelsPerUnit ).toFixed( 2 ) ),
			} );
			expect( select( blockEditorStore ).isSelectionEnabled() ).toBe(
				false
			);
			await act( async () => {
				getResizeCallbacks().onResizeStop( 400 );
			} );
			expect( getAttributes() ).toMatchObject( {
				minHeightUnit: unit,
				minHeight: Number( ( 400 / pixelsPerUnit ).toFixed( 2 ) ),
			} );
			expect(
				parseFloat( view.getComputedStyle( cover ).minHeight )
			).toBeCloseTo( 400, 1 );
			expect( select( blockEditorStore ).isSelectionEnabled() ).toBe(
				true
			);
		}
	);

	test( 'preserves a relative unit when the initial minimum is zero', async () => {
		const { getAttributes } = await setup( 'em', 0 );
		await act( async () => {
			getResizeCallbacks().onResizeStart( 300 );
			getResizeCallbacks().onResizeStop( 400 );
		} );
		expect( getAttributes() ).toMatchObject( {
			minHeightUnit: 'em',
			minHeight: 16,
		} );
	} );

	test( 'falls back to pixels when the font size cannot provide a nonzero em', async () => {
		const { cover, getAttributes } = await setup( 'em' );
		cover.style.fontSize = '0px';
		await act( async () => {
			getResizeCallbacks().onResizeStart( 300 );
			getResizeCallbacks().onResizeStop( 400 );
		} );
		expect( getAttributes() ).toMatchObject( {
			minHeightUnit: 'px',
			minHeight: 400,
		} );
	} );

	test.each( [ undefined, '%' ] )(
		'uses pixels for an unsupported unit (%s)',
		async ( unit ) => {
			const { getAttributes } = await setup( unit );
			await act( async () => {
				getResizeCallbacks().onResizeStart( 300 );
				getResizeCallbacks().onResizeStop( 400 );
			} );
			expect( getAttributes() ).toMatchObject( {
				minHeightUnit: 'px',
				minHeight: 400,
			} );
		}
	);
} );
