import { describe, expect, it } from 'vitest';
import { getStyleSourceLabel } from '../source-label';

describe( 'getStyleSourceLabel', () => {
	it( 'names the Styles section for a root value', () => {
		expect(
			getStyleSourceLabel(
				{ layer: 'root' },
				{ path: [ 'typography', 'fontSize' ] }
			)
		).toBe( 'Typography style' );
		expect(
			getStyleSourceLabel(
				{ layer: 'root' },
				{ path: [ 'elements', 'link', 'color', 'text' ] }
			)
		).toBe( 'Colors style' );
	} );

	it( 'names the element for an element value', () => {
		expect(
			getStyleSourceLabel(
				{ layer: 'element' },
				{ path: [ 'color', 'text' ], elementName: 'h2' }
			)
		).toBe( 'H2 element' );
	} );

	it( 'names the block type for a block value', () => {
		expect(
			getStyleSourceLabel(
				{ layer: 'block' },
				{ path: [ 'color', 'text' ], blockTitle: 'Paragraph' }
			)
		).toBe( 'Paragraph block' );
	} );

	it( 'names the variation for a block style variation value', () => {
		expect(
			getStyleSourceLabel(
				{ layer: 'blockVariation' },
				{ path: [ 'spacing', 'padding' ], variationLabel: 'Annotation' }
			)
		).toBe( '“Annotation” block style variation' );
	} );

	it( 'returns null rather than guessing a source', () => {
		expect( getStyleSourceLabel( undefined, {} ) ).toBeNull();
		expect(
			getStyleSourceLabel( { layer: 'theme' }, { path: [ 'color' ] } )
		).toBeNull();
		expect(
			getStyleSourceLabel(
				{ layer: 'root' },
				{ path: [ 'border', 'color' ] }
			)
		).toBeNull();
		expect(
			getStyleSourceLabel(
				{ layer: 'element' },
				{ path: [ 'color', 'text' ] }
			)
		).toBeNull();
		expect(
			getStyleSourceLabel(
				{ layer: 'blockVariation' },
				{ path: [ 'color', 'text' ] }
			)
		).toBeNull();
	} );
} );
