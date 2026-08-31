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

	it( 'uses the vertical block gap when a flow layout receives an axial gap', () => {
		const result = flow.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {
				spacing: { blockGap: { top: '2rem', left: '3rem' } },
			},
			blockName: 'test-block',
			hasBlockGapSupport: true,
			layoutDefinitions: {
				default: {
					spacingStyles: [
						{
							selector: ' > * + *',
							rules: { 'margin-block-start': null },
						},
					],
				},
			},
		} );

		expect( result ).toBe(
			'.my-container > * + * { margin-block-start: 2rem; }'
		);
	} );
} );
