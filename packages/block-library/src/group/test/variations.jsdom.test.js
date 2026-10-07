import { beforeAll, describe, expect, it, vi } from 'vitest';

// The variation list is built once, when the module is first evaluated. Each
// variant is loaded exactly once here — re-importing per test drags the whole
// icon library through the transform again and makes the file time out.
let withExperiment;
let withoutExperiment;

async function loadVariations( enabled ) {
	vi.resetModules();
	window.__experimentalEnableFreeformCanvas = enabled;
	try {
		return ( await import( '../variations' ) ).default;
	} finally {
		delete window.__experimentalEnableFreeformCanvas;
	}
}

beforeAll( async () => {
	withExperiment = await loadVariations( true );
	withoutExperiment = await loadVariations( false );
}, 30000 );

const names = ( list ) => list.map( ( variation ) => variation.name );

describe( 'group variations', () => {
	it( 'offers the four layouts a group can have', () => {
		expect( names( withoutExperiment ) ).toEqual( [
			'group',
			'group-row',
			'group-stack',
			'group-grid',
		] );
	} );

	it( 'adds nothing when the freeform canvas experiment is on', () => {
		// A freeform canvas is not a kind of group you insert — any section
		// becomes one by dragging something inside it, and stays a Group.
		expect( names( withExperiment ) ).toEqual( names( withoutExperiment ) );
	} );

	it( 'keeps Group as the default', () => {
		expect(
			withExperiment.find( ( variation ) => variation.isDefault ).name
		).toBe( 'group' );
	} );
} );
