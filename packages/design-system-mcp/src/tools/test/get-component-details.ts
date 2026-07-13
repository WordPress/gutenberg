import { handler } from '../get-component-details';
import { getComponentDetail } from '../../data';
import { formatComponentDetail } from '../../format';
import type { ComponentDetail } from '../../types';

jest.mock( '../../data' );

const mockGetComponentDetail = getComponentDetail as jest.MockedFunction<
	typeof getComponentDetail
>;

function fakeDetail( name: string ): ComponentDetail {
	return {
		name,
		description: `${ name } description.`,
		packageName: '@wordpress/ui',
		importStatement: `import { ${ name } } from '@wordpress/ui';`,
		props: [],
		stories: [],
	};
}

describe( 'handler', () => {
	beforeEach( () => {
		mockGetComponentDetail.mockReset();
	} );

	it( 'returns a single formatted section for a string name', async () => {
		const button = fakeDetail( 'Button' );
		mockGetComponentDetail.mockResolvedValueOnce( button );

		const result = await handler( { name: 'Button' } );

		expect( mockGetComponentDetail ).toHaveBeenCalledTimes( 1 );
		expect( mockGetComponentDetail ).toHaveBeenCalledWith( 'Button' );
		expect( result ).toEqual( {
			content: [
				{ type: 'text', text: formatComponentDetail( button ) },
			],
		} );
	} );

	it( 'joins multiple components with the section separator', async () => {
		const button = fakeDetail( 'Button' );
		const tabs = fakeDetail( 'Tabs' );
		mockGetComponentDetail
			.mockResolvedValueOnce( button )
			.mockResolvedValueOnce( tabs );

		const result = await handler( { name: [ 'Button', 'Tabs' ] } );

		expect( mockGetComponentDetail.mock.calls ).toEqual( [
			[ 'Button' ],
			[ 'Tabs' ],
		] );
		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: `${ formatComponentDetail(
						button
					) }\n\n---\n\n${ formatComponentDetail( tabs ) }`,
				},
			],
		} );
	} );

	it( 'appends a missing footer when some names are not found', async () => {
		const button = fakeDetail( 'Button' );
		mockGetComponentDetail
			.mockResolvedValueOnce( button )
			.mockResolvedValueOnce( null );

		const result = await handler( { name: [ 'Button', 'Nope' ] } );

		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: `${ formatComponentDetail(
						button
					) }\n\n---\n\n_No components were found for: "Nope"._`,
				},
			],
		} );
	} );

	it( 'quotes and comma-joins multiple missing names in the footer', async () => {
		const button = fakeDetail( 'Button' );
		mockGetComponentDetail
			.mockResolvedValueOnce( button )
			.mockResolvedValueOnce( null )
			.mockResolvedValueOnce( null );

		const result = await handler( {
			name: [ 'Button', 'Nope', 'AlsoNope' ],
		} );

		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: `${ formatComponentDetail(
						button
					) }\n\n---\n\n_No components were found for: "Nope", "AlsoNope"._`,
				},
			],
		} );
	} );

	it( 'returns isError when no components are found', async () => {
		mockGetComponentDetail.mockResolvedValue( null );

		const result = await handler( { name: [ 'Foo', 'Bar' ] } );

		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: 'No components were found for: "Foo", "Bar".',
				},
			],
			isError: true,
		} );
	} );
} );
