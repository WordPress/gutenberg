/**
 * Internal dependencies
 */
import {
	parsePlaywrightSelector,
	assembleDOMSelector,
} from '../block-selector-engine';

describe.skip( 'parsePlaywrightSelector', () => {
	it( 'parses various selectors, returning data in an object', () => {
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
				'core/template-part[title="Template Part"][clientId="b4745090-1dd6-4178-9205-38baf7a10795"][tag="header"]'
			)
		).toEqual( {
			clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
			name: 'core/template-part',
			tag: 'header',
			title: 'Template Part',
		} );
	} );
} );

describe.skip( 'assembleDOMSelector', () => {
	it( 'assembles various DOM selectors for blocks', () => {
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
		).toBe( '*[data-type="core/paragraph"]' );

		expect(
			assembleDOMSelector( {
				title: 'Spacer',
			} )
		).toBe( '*[data-title="Spacer"]' );

		expect(
			assembleDOMSelector( {
				name: 'core/template-part',
				clientId: 'b4745090-1dd6-4178-9205-38baf7a10795',
				tag: 'header',
				title: 'Template Part',
			} )
		).toBe(
			'header[data-type="core/template-part"][data-block="b4745090-1dd6-4178-9205-38baf7a10795"][data-title="Template Part"]'
		);
	} );
} );
