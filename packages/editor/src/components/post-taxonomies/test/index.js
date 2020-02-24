/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import TestUtils from 'react-dom/test-utils';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PostTaxonomies } from '../';
import { HierarchicalTermSelector } from '../hierarchical-term-selector';
import { buildTermsTree } from '../../../utils/terms';

describe( 'PostTaxonomies', () => {
	it( 'should render no children if taxonomy data not available', () => {
		const taxonomies = {};

		const wrapper = shallow(
			<PostTaxonomies postType="page" taxonomies={ taxonomies } />
		);

		expect( wrapper.at( 0 ) ).toHaveLength( 0 );
	} );

	it( 'should render taxonomy components for taxonomies assigned to post type', () => {
		const genresTaxonomy = {
			name: 'Genres',
			slug: 'genre',
			types: [ 'book' ],
			hierarchical: true,
			rest_base: 'genres',
			visibility: {
				show_ui: true,
			},
		};

		const categoriesTaxonomy = {
			name: 'Categories',
			slug: 'category',
			types: [ 'post', 'page' ],
			hierarchical: true,
			rest_base: 'categories',
			visibility: {
				show_ui: true,
			},
		};

		const wrapperOne = shallow(
			<PostTaxonomies
				postType="book"
				taxonomies={ [ genresTaxonomy, categoriesTaxonomy ] }
			/>
		);

		expect( wrapperOne ).toHaveLength( 1 );

		const wrapperTwo = shallow(
			<PostTaxonomies
				postType="book"
				taxonomies={ [
					genresTaxonomy,
					{
						...categoriesTaxonomy,
						types: [ 'post', 'page', 'book' ],
					},
				] }
			/>
		);

		expect( wrapperTwo ).toHaveLength( 2 );
	} );

	it( 'should not render taxonomy components that hide their ui', () => {
		const genresTaxonomy = {
			name: 'Genres',
			slug: 'genre',
			types: [ 'book' ],
			hierarchical: true,
			rest_base: 'genres',
			visibility: {
				show_ui: true,
			},
		};

		const wrapperOne = shallow(
			<PostTaxonomies postType="book" taxonomies={ [ genresTaxonomy ] } />
		);

		expect( wrapperOne.at( 0 ) ).toHaveLength( 1 );

		const wrapperTwo = shallow(
			<PostTaxonomies
				postType="book"
				taxonomies={ [
					{
						...genresTaxonomy,
						visibility: { show_ui: false },
					},
				] }
			/>
		);

		expect( wrapperTwo.at( 0 ) ).toHaveLength( 0 );
	} );
} );

describe( 'HierarchicalTermSelector', () => {
	// Simulates the state passed in from the store.
	class App extends Component {
		constructor( props ) {
			super( props );
			this.state = { selectedTerms: [] };
		}

		render() {
			return (
				<HierarchicalTermSelector
					terms={ this.state.selectedTerms }
					hasAssignAction={ true }
					debouncedSpeak={ () => null }
				/>
			);
		}
	}

	const getStateWrapperAndWrapperWithDefaultTerms = (
		defaultTerms = [
			{ id: 3, name: 'Zurich', children: [] },
			{ id: 1, name: 'Atlanta', children: [] },
			{
				id: 2,
				name: 'Chicago',
				children: [
					{
						id: 6,
						name: 'Skokie',
						children: [],
					},
					{
						id: 5,
						name: 'Naperville',
						children: [],
					},
					{
						id: 4,
						name: 'Aurora',
						children: [],
					},
				],
			},
		]
	) => {
		const app = TestUtils.renderIntoDocument( <App /> );
		const wrapper = TestUtils.findRenderedComponentWithType(
			app,
			HierarchicalTermSelector
		);

		wrapper.setState( {
			availableTerms: defaultTerms,
			availableTermsTree: wrapper.sortBySelected(
				buildTermsTree( defaultTerms )
			),
		} );

		return { wrapper, app };
	};

	it( 'rerenders tree with no terms selected', () => {
		const { wrapper } = getStateWrapperAndWrapperWithDefaultTerms();

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__input'
			)
		).toHaveLength( 6 );
	} );

	it( 'handles changes to selected terms', () => {
		const { app, wrapper } = getStateWrapperAndWrapperWithDefaultTerms();

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__checked'
			)
		).toHaveLength( 0 );

		app.setState( { selectedTerms: [ 1 ] } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__checked'
			)
		).toHaveLength( 1 );

		app.setState( { selectedTerms: [ 1, 5 ] } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__checked'
			)
		).toHaveLength( 2 );

		app.setState( { selectedTerms: [] } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__checked'
			)
		).toHaveLength( 0 );
	} );

	it( 'brings selected terms to the top', () => {
		const { app, wrapper } = getStateWrapperAndWrapperWithDefaultTerms();

		// No selected terms; Atlanta should be first.
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Atlanta' ) );

		// Select Zurich.
		app.setState( { selectedTerms: [ 3 ] } );

		// Zurich should be first.
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Zurich' ) );

		// Unset selection. Items should be alphabetical again.
		app.setState( { selectedTerms: [] } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Atlanta' ) );
	} );

	it( 'shows matching search terms', () => {
		const { wrapper } = getStateWrapperAndWrapperWithDefaultTerms();

		wrapper.setFilterValue( { target: { value: 'zur' } } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__input'
			)
		).toHaveLength( 1 );

		wrapper.setFilterValue( { target: { value: 'i' } } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__input'
			)
		).toHaveLength( 4 );
	} );

	it( 'shows selected matching search terms first', () => {
		const { app, wrapper } = getStateWrapperAndWrapperWithDefaultTerms();

		wrapper.setFilterValue( { target: { value: 'i' } } );

		// No terms selected. The search terms display alphabetically.
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Chicago' ) );

		// Select Zurich.
		app.setState( { selectedTerms: [ 3 ] } );

		// Expect Zurich to come first.
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Zurich' ) );

		// Add a child of Chicago.
		app.setState( { selectedTerms: [ 3, 6 ] } );

		// Chicago will now be first even though it's not selected.
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Chicago' ) );

		// And the child will be next.
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 1 ].innerHTML
		).toEqual( expect.stringContaining( 'Skokie' ) );

		// Unselect all.
		app.setState( { selectedTerms: [] } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Chicago' ) );

		wrapper.setFilterValue( { target: { value: '' } } );

		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-checkbox-control__label'
			)[ 0 ].innerHTML
		).toEqual( expect.stringContaining( 'Atlanta' ) );
	} );
} );
