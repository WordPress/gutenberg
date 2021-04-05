/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SearchEdit from '../edit.native.js';

const setAttributes = jest.fn();

const getTestComponent = ( attributes = {} ) => {
	return renderer.create(
		<SearchEdit attributes={ attributes } setAttributes={ jest.fn() } />
	);
};

const getLabel = ( instance ) => {
	return instance.findByProps( {
		className: 'wp-block-search__label',
	} );
};

const getButton = ( instance ) => {
	return instance.findByProps( {
		className: 'wp-block-search__button',
	} );
};

const getSearchInput = ( instance ) => {
	return instance.findByProps( {
		className: 'wp-block-search__input',
	} );
};

const hasComponent = ( instance, className ) => {
	const components = instance.findAllByProps( {
		className,
	} );
	return components.length !== 0;
};

describe( 'Search block', () => {
	it( 'renders block without crashing', () => {
		const component = getTestComponent();
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders default block configuration', () => {
		const component = getTestComponent( {
			label: 'Search',
			buttonText: 'Search Button',
			buttonPosition: 'button-outside',
			showLabel: true,
		} );
		const instance = component.root;

		// Verify the label element of the search block exists and
		// label text is set.
		const label = getLabel( instance );
		expect( label ).toBeTruthy();
		expect( label.props.value ).toBe( 'Search' );

		// Verify the button element of the search block exists and
		// button text is set.
		const button = getButton( instance );
		expect( button ).toBeTruthy();
		expect( button.props.value ).toBe( 'Search Button' );

		// Verify the search input element of the search block exists
		// and the placeholder text is set.
		const searchInput = getSearchInput( instance );
		expect( searchInput ).toBeTruthy();
		expect( searchInput.props.placeholder ).toBe( 'Optional placeholder…' );

		// Verify toMatchSnapshot
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders block with no-button option', () => {
		const component = getTestComponent( {
			label: 'Search',
			buttonPosition: 'no-button',
			showLabel: true,
		} );
		const instance = component.root;

		// Verify the label element of the search block exists and
		// label text is set.
		const label = getLabel( instance );
		expect( label ).toBeTruthy();
		expect( label.props.value ).toBe( 'Search' );

		// Verify the button element has not been rendered.
		expect( hasComponent( instance, 'wp-block-search__button' ) ).toEqual(
			false
		);

		// Verify the search input element of the search block exists
		// and the placeholder text is set.
		const searchInput = getSearchInput( instance );
		expect( searchInput ).toBeTruthy();
		expect( searchInput.props.placeholder ).toBe( 'Optional placeholder…' );

		// Verify toMatchSnapshot
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders block with icon button option', () => {
		const component = getTestComponent( {
			label: 'Search',
			buttonUseIcon: true,
			showLabel: true,
			buttonPosition: 'button-outside',
		} );
		const instance = component.root;

		// Verify the label element of the search block exists and
		// label text is set.
		const label = getLabel( instance );
		expect( label ).toBeTruthy();
		expect( label.props.value ).toBe( 'Search' );

		// Verify the button element of the search block exists and
		// is rendered with an icon.
		const button = instance.findByType( Icon );
		expect( button ).toBeTruthy();

		// Verify the search input element of the search block exists
		// and the placeholder text is set.
		const searchInput = getSearchInput( instance );
		expect( searchInput ).toBeTruthy();
		expect( searchInput.props.placeholder ).toBe( 'Optional placeholder…' );

		// Verify toMatchSnapshot
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders block with button inside option', () => {
		const component = getTestComponent( {
			label: 'Search',
			buttonText: 'Search Button',
			buttonPosition: 'button-inside',
			showLabel: true,
		} );
		const instance = component.root;

		// Verify the label element of the search block exists and
		// label text is set.
		const label = getLabel( instance );
		expect( label ).toBeTruthy();
		expect( label.props.value ).toBe( 'Search' );

		// Verify the button element of the search block exists and
		// button text is set.
		const button = getButton( instance );
		expect( button ).toBeTruthy();
		expect( button.props.value ).toBe( 'Search Button' );

		// Verify the search input element of the search block exists
		// and the placeholder text is set.
		const searchInput = getSearchInput( instance );
		expect( searchInput ).toBeTruthy();
		expect( searchInput.props.placeholder ).toBe( 'Optional placeholder…' );

		// Verify toMatchSnapshot
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders block with label hidden', () => {
		const component = getTestComponent( {
			label: 'Search',
			buttonText: 'Search Button',
			buttonPosition: 'button-outside',
			showLabel: false,
		} );
		const instance = component.root;

		// Verify the label has not been rendered.
		expect( hasComponent( instance, 'wp-block-search__label' ) ).toEqual(
			false
		);

		// Verify the button element of the search block exists and
		// button text is set.
		const button = getButton( instance );
		expect( button ).toBeTruthy();
		expect( button.props.value ).toBe( 'Search Button' );

		// Verify the search input element of the search block exists
		// and the placeholder text is set.
		const searchInput = getSearchInput( instance );
		expect( searchInput ).toBeTruthy();
		expect( searchInput.props.placeholder ).toBe( 'Optional placeholder…' );

		// Verify toMatchSnapshot
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );
} );
