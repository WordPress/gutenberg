/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SearchEdit from '../edit.native.js';

// react-native-aztec shouldn't be mocked because these tests are based on
// snapshot testing where we want to keep the original component.
jest.unmock( '@wordpress/react-native-aztec' );

const defaultAttributes = {
	label: 'Search',
	buttonText: 'Search Button',
	buttonPosition: 'button-outside',
	showLabel: true,
};

const getTestComponent = ( attributes = {} ) => {
	const finalAttrs = { ...defaultAttributes, ...attributes };
	return render(
		<SearchEdit attributes={ finalAttrs } setAttributes={ jest.fn() } />
	);
};

const getLabel = ( instance ) => {
	return instance.UNSAFE_getByProps( {
		className: 'wp-block-search__label',
	} );
};

const getButton = ( instance ) => {
	return instance.UNSAFE_getByProps( {
		className: 'wp-block-search__button',
	} );
};

const getSearchInput = ( instance ) => {
	return instance.UNSAFE_getByProps( {
		className: 'wp-block-search__input',
	} );
};

const hasComponent = ( instance, className ) => {
	const components = instance.UNSAFE_queryAllByProps( {
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
		let instance;
		beforeEach( () => {
			instance = getTestComponent();
		} );

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
			const rendered = instance.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );

	describe( 'renders with no-button option', () => {
		let instance;
		beforeEach( () => {
			instance = getTestComponent( {
				buttonPosition: 'no-button',
			} );
		} );

		it( 'verify button element has not been rendered', () => {
			expect(
				hasComponent( instance, 'wp-block-search__button' )
			).toEqual( false );
		} );

		it( 'matches snapshot', () => {
			const rendered = instance.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );

	describe( 'renders block with icon button option', () => {
		let instance;
		beforeEach( () => {
			instance = getTestComponent( {
				buttonUseIcon: true,
			} );
		} );

		it( 'search button uses icon', () => {
			const button = instance.UNSAFE_getByType( Icon );
			expect( button ).toBeTruthy();
		} );

		it( 'matches snapshot', () => {
			const rendered = instance.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );

	it( 'renders block with button inside option', () => {
		const instance = getTestComponent( {
			buttonPosition: 'button-inside',
		} );

		const rendered = instance.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	describe( 'renders block with label hidden', () => {
		let instance;
		beforeEach( () => {
			instance = getTestComponent( {
				showLabel: false,
			} );
		} );

		it( 'verify label has not been rendered', () => {
			expect(
				hasComponent( instance, 'wp-block-search__label' )
			).toEqual( false );
		} );

		it( 'matches snapshot', () => {
			const rendered = instance.toJSON();
			expect( rendered ).toMatchSnapshot();
		} );
	} );
} );
