/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostTaxonomies } from '../';

describe( 'PostTaxonomies', () => {
	it( 'should render no children if taxonomy data not available', () => {
		const taxonomies = {};

		const wrapper = shallow(
			<PostTaxonomies postType="page" taxonomies={ taxonomies } />
		);

		expect( wrapper.children() ).toHaveLength( 0 );
	} );

	it( 'should render taxonomy components for taxonomies assigned to post type', () => {
		const taxonomies = {
			data: [
				{
					name: 'Categories',
					slug: 'category',
					types: [ 'post', 'page' ],
					hierarchical: true,
					rest_base: 'categories',
				},
				{
					name: 'Genres',
					slug: 'genre',
					types: [ 'book' ],
					hierarchical: true,
					rest_base: 'genres',
				},
			],
		};

		const wrapper = shallow(
			<PostTaxonomies postType="page" taxonomies={ taxonomies } />
		);

		expect( wrapper.children() ).toHaveLength( 1 );
		expect( wrapper.childAt( 0 ).props() ).toEqual( {
			label: 'Categories',
			slug: 'category',
			restBase: 'categories',
		} );
	} );
} );
