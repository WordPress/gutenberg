/**
 * Internal dependencies
 */
import { appendSelectors, getBlockGapCSS } from '../utils';

const layoutDefinitions = {
	default: {
		spacingStyles: [
			{
				selector: ' > *',
				rules: {
					'margin-block-start': '0',
					'margin-block-end': '0',
				},
			},
			{
				selector: ' > * + *',
				rules: {
					'margin-block-start': null,
					'margin-block-end': '0',
				},
			},
		],
	},
	flex: {
		spacingStyles: [
			{
				selector: '',
				rules: {
					gap: null,
				},
			},
		],
	},
};

describe( 'getBlockGapCSS', () => {
	it( 'should output default blockGap rules', () => {
		const expected =
			'.editor-styles-wrapper .my-container > * { margin-block-start: 0; margin-block-end: 0; }.editor-styles-wrapper .my-container > * + * { margin-block-start: 3em; margin-block-end: 0; }';

		const result = getBlockGapCSS(
			'.my-container',
			layoutDefinitions,
			'default',
			'3em'
		);

		expect( result ).toBe( expected );
	} );

	it( 'should output flex blockGap rules', () => {
		const expected = '.editor-styles-wrapper .my-container { gap: 3em; }';

		const result = getBlockGapCSS(
			'.my-container',
			layoutDefinitions,
			'flex',
			'3em'
		);

		expect( result ).toBe( expected );
	} );

	it( 'should return an empty string if layout type cannot be found', () => {
		const expected = '';

		const result = getBlockGapCSS(
			'.my-container',
			layoutDefinitions,
			'aTypeThatDoesNotExist',
			'3em'
		);

		expect( result ).toBe( expected );
	} );

	it( 'should return an empty string if layout definitions is null', () => {
		const expected = '';

		const result = getBlockGapCSS( '.my-container', null, 'flex', '3em' );

		expect( result ).toBe( expected );
	} );

	it( 'should return an empty string if blockGap is empty', () => {
		const expected = '';

		const result = getBlockGapCSS(
			'.my-container',
			layoutDefinitions,
			'flex',
			null
		);

		expect( result ).toBe( expected );
	} );

	it( 'should treat a blockGap string containing 0 as a valid value', () => {
		const expected = '.editor-styles-wrapper .my-container { gap: 0; }';

		const result = getBlockGapCSS(
			'.my-container',
			layoutDefinitions,
			'flex',
			'0'
		);

		expect( result ).toBe( expected );
	} );
} );

describe( 'appendSelectors', () => {
	it( 'should append a subselector without an appended selector', () => {
		expect( appendSelectors( '.original-selector' ) ).toBe(
			'.editor-styles-wrapper .original-selector'
		);
	} );

	it( 'should append a subselector to a single selector', () => {
		expect( appendSelectors( '.original-selector', '.appended' ) ).toBe(
			'.editor-styles-wrapper .original-selector .appended'
		);
	} );

	it( 'should append a subselector to multiple selectors', () => {
		expect(
			appendSelectors( '.first-selector,.second-selector', '.appended' )
		).toBe(
			'.editor-styles-wrapper .first-selector .appended,.editor-styles-wrapper .second-selector .appended'
		);
	} );
} );
