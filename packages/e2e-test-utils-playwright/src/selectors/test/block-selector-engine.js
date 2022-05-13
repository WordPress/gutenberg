/**
 * Internal dependencies
 */
import createBlockSelectorEngine from '../block-selector-engine';

describe( 'parsePlaywrightSelector', () => {
	it( 'requires title, clientId, and tag to be within square brackets', () => {
		const { parsePlaywrightSelector } = createBlockSelectorEngine();

		expect(
			parsePlaywrightSelector(
				'title="Template Part" clientId="b4745090-1dd6-4178-9205-38baf7a10795" tag="header"'
			)
		).toEqual(
			expect.objectContaining( {
				title: undefined,
				clientId: undefined,
				tag: undefined,
			} )
		);
	} );

	it( 'parses various selectors, returning data in an object', () => {
		const { parsePlaywrightSelector } = createBlockSelectorEngine();

		expect( parsePlaywrightSelector( 'core/paragraph' ) ).toEqual(
			expect.objectContaining( {
				name: 'core/paragraph',
			} )
		);

		expect(
			parsePlaywrightSelector(
				'core/quote[clientId="b4745090-1dd6-4178-9205-38baf7a10795"]'
			)
		).toEqual(
			expect.objectContaining( {
				name: 'core/quote',
				clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
			} )
		);

		expect(
			parsePlaywrightSelector(
				'*[clientId="b4745090-1dd6-4178-9205-38baf7a10795"]'
			)
		).toEqual(
			expect.objectContaining( {
				clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
			} )
		);

		expect(
			parsePlaywrightSelector( 'core/template-part[tag="header"]' )
		).toEqual(
			expect.objectContaining( {
				name: 'core/template-part',
				tag: 'header',
			} )
		);

		expect( parsePlaywrightSelector( '*[title="Spacer"]' ) ).toEqual(
			expect.objectContaining( {
				title: 'Spacer',
			} )
		);

		expect(
			parsePlaywrightSelector(
				'core/template-part[title="Template Part",clientId="b4745090-1dd6-4178-9205-38baf7a10795",tag="header"]'
			)
		).toEqual( {
			clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
			name: 'core/template-part',
			tag: 'header',
			title: 'Template Part',
		} );
	} );
} );

describe( 'assembleDOMSelector', () => {
	it( 'assembles various DOM selectors for blocks', () => {
		const { assembleDOMSelector } = createBlockSelectorEngine();

		// Return the first block.
		expect( assembleDOMSelector( {} ) ).toBe( '*[data-block]' );

		expect(
			assembleDOMSelector( {
				tag: 'header',
			} )
		).toBe( 'header[data-block]' );

		expect(
			assembleDOMSelector( {
				clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
			} )
		).toBe( '*[data-block="b4745090-1dd6-4178-9205-38baf7a10795"]' );

		expect(
			assembleDOMSelector( {
				name: 'core/paragraph',
			} )
		).toBe( '*[data-block][data-type="core/paragraph"]' );

		expect(
			assembleDOMSelector( {
				title: 'Spacer',
			} )
		).toBe( '*[data-block][data-title="Spacer"]' );

		expect(
			assembleDOMSelector( {
				name: 'core/template-part',
				clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
				tag: 'header',
				title: 'Template Part',
			} )
		).toBe(
			'header[data-block="b4745090-1dd6-4178-9205-38baf7a10795"][data-type="core/template-part"][data-title="Template Part"]'
		);
	} );
} );
