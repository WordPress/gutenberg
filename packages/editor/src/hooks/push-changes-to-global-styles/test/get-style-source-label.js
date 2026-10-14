import { describe, expect, it } from 'vitest';
import { getStyleSourceLabel } from '../get-style-source-label';

const context = {
	pathKey: 'typography.fontSize',
	blockTitle: 'Button',
	variationLabel: 'Outline',
};

describe( 'getStyleSourceLabel', () => {
	it( 'names a root source by its site-wide section', () => {
		expect( getStyleSourceLabel( { layer: 'root' }, context ) ).toBe(
			'Site typography'
		);
		expect(
			getStyleSourceLabel(
				{ layer: 'root' },
				{ ...context, pathKey: 'color.text' }
			)
		).toBe( 'Site colors' );
	} );

	it( 'names an element source by its element', () => {
		expect(
			getStyleSourceLabel(
				{ layer: 'element', element: 'button' },
				context
			)
		).toBe( 'Button element' );
	} );

	it( 'names a block source by the block title', () => {
		expect( getStyleSourceLabel( { layer: 'block' }, context ) ).toBe(
			'Button block'
		);
	} );

	it( 'names a block style variation source by its label', () => {
		expect(
			getStyleSourceLabel( { layer: 'blockVariation' }, context )
		).toBe( 'Outline style' );
	} );

	it( 'says nothing else sets the value when there is no source', () => {
		expect( getStyleSourceLabel( null, context ) ).toBe(
			'Not set in Global Styles'
		);
		expect( getStyleSourceLabel( { layer: 'theme' }, context ) ).toBe(
			'Not set in Global Styles'
		);
	} );
} );
