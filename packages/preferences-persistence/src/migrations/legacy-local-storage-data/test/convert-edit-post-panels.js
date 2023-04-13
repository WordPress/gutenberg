/**
 * Internal dependencies
 */
import convertEditPostPanels from '../convert-edit-post-panels';

describe( 'convertEditPostPanels', () => {
	it( 'converts from one format to another', () => {
		expect(
			convertEditPostPanels( {
				panels: {
					tags: {
						enabled: true,
						opened: true,
					},
					permalinks: {
						enabled: false,
						opened: false,
					},
					categories: {
						enabled: true,
						opened: false,
					},
					excerpt: {
						enabled: false,
						opened: true,
					},
					discussion: {
						enabled: false,
					},
					template: {
						opened: true,
					},
				},
			} )
		).toEqual( {
			inactivePanels: [ 'permalinks', 'excerpt', 'discussion' ],
			openPanels: [ 'tags', 'excerpt', 'template' ],
		} );
	} );

	it( 'returns empty arrays when there is no data to convert', () => {
		expect( convertEditPostPanels( {} ) ).toEqual( {
			inactivePanels: [],
			openPanels: [],
		} );
	} );
} );
