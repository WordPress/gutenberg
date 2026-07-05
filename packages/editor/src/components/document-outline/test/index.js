/**
 * Internal dependencies
 */
import { computeOutlineHeadings } from '../';

describe( 'computeOutlineHeadings', () => {
	const blocks = [
		{
			clientId: '1',
			name: 'core/heading',
			attributes: { level: 2, content: 'Heading' },
		},
		{
			clientId: '2',
			name: 'core/paragraph',
			attributes: { content: 'Paragraph' },
		},
		{
			clientId: '3',
			name: 'my-plugin/section-heading',
			attributes: { level: 3, content: 'Custom heading' },
		},
	];

	it( 'only includes core/heading blocks by default', () => {
		const headings = computeOutlineHeadings( blocks, [ 'core/heading' ] );

		expect( headings ).toHaveLength( 1 );
		expect( headings[ 0 ] ).toMatchObject( {
			clientId: '1',
			level: 2,
			isEmpty: false,
		} );
	} );

	it( 'includes any block name passed in headingBlockTypes', () => {
		const headingBlockTypes = [
			'core/heading',
			'my-plugin/section-heading',
		];
		const headings = computeOutlineHeadings( blocks, headingBlockTypes );

		expect( headings ).toHaveLength( 2 );
		expect( headings[ 1 ] ).toMatchObject( {
			clientId: '3',
			level: 3,
			isEmpty: false,
		} );
	} );
} );
