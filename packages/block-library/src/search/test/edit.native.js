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

const defaultAttributes = {
	label: 'Search',
	buttonText: 'Search Button',
	buttonPosition: 'button-outside',
	showLabel: true,
};

const getTestComponent = ( attributes = {} ) => {
	const finalAttrs = { ...defaultAttributes, ...attributes };
	return renderer.create(
		<SearchEdit attributes={ finalAttrs } setAttributes={ jest.fn() } />
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

describe( 'Search Block', () => {
	it( 'renders without crashing', () => {
		const component = getTestComponent();
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	describe( 'renders with default configuration', () => {
		const component = getTestComponent();
		const instance = component.root;

		it( 'label is visible and text is properly set', () => {
			// Verify the label element of the search block exists and
			// label text is set.
			const label = getLabel( instance );
			expect( label ).toBeTruthy();
			expect( label.props.value ).toBe( 'Search' );
		} );

		it( 'button is visible and text is properly set', () => {
			// Verify the button element of the search block exists and
			// button text is set.
			const button = getButton( instance );
			expect( button ).toBeTruthy();
			expect( button.props.value ).toBe( 'Search Button' );
		} );

		it( 'search input is visible and placeholder text is properly set', () => {
			// Verify the search input element of the search block exists
			// and the placeholder text is set.
			const searchInput = getSearchInput( instance );
			expect( searchInput ).toBeTruthy();
			expect( searchInput.props.placeholder ).toBe(
				'Optional placeholder…'
			);
		} );

		it( 'matches snapshot', () => {
			const rendered = component.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );

	describe( 'renders with no-button option', () => {
		const component = getTestComponent( {
			buttonPosition: 'no-button',
		} );
		const instance = component.root;

		it( 'verify button element has not been rendered', () => {
			expect(
				hasComponent( instance, 'wp-block-search__button' )
			).toEqual( false );
		} );

		it( 'matches snapshot', () => {
			const rendered = component.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );

	describe( 'renders block with icon button option', () => {
		const component = getTestComponent( {
			buttonUseIcon: true,
		} );
		const instance = component.root;

		it( 'search button uses icon', () => {
			const button = instance.findByType( Icon );
			expect( button ).toBeTruthy();
		} );

		it( 'matches snapshot', () => {
			const rendered = component.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );

	it( 'renders block with button inside option', () => {
		const component = getTestComponent( {
			buttonPosition: 'button-inside',
		} );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	describe( 'renders block with label hidden', () => {
		const component = getTestComponent( {
			showLabel: false,
		} );
		const instance = component.root;

		it( 'verify label has not been rendered', () => {
			expect(
				hasComponent( instance, 'wp-block-search__label' )
			).toEqual( false );
		} );

		it( 'matches snapshot', () => {
			const rendered = component.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );
} );
