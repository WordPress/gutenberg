/**
 * Internal dependencies
 */
import flow from '../flow';

describe( 'getLayoutStyle', () => {
	it( 'should return an empty string if no non-default params are provided', () => {
		const expected = '';

		const result = flow.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );

	it( 'should fall back to the global block gap when the block has no explicit blockGap', () => {
		const result = flow.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: true,
			globalBlockGapValue: 'var(--wp--preset--spacing--30)',
		} );

		expect( result ).toContain(
			'.my-container > * { margin-block-start: var(--wp--preset--spacing--30); margin-block-end: 0; }'
		);
	} );

	it( 'should prefer an explicit blockGap over the global block gap fallback', () => {
		const result = flow.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: { spacing: { blockGap: '10px' } },
			blockName: 'test-block',
			hasBlockGapSupport: true,
			globalBlockGapValue: 'var(--wp--preset--spacing--30)',
		} );

		expect( result ).toContain(
			'.my-container > * { margin-block-start: 10px; margin-block-end: 0; }'
		);
		expect( result ).not.toContain( 'var(--wp--preset--spacing--30)' );
	} );

	it( 'should not apply the global block gap fallback for viewport overrides', () => {
		const result = flow.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: true,
			globalBlockGapValue: 'var(--wp--preset--spacing--30)',
			viewportOverrides: {},
		} );

		expect( result ).toBe( '' );
	} );
} );
