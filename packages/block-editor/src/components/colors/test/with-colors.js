/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockEditContextProvider } from '../../block-edit';
import { createCustomColorsHOC } from '../with-colors';

describe( 'createCustomColorsHOC', () => {
	it( 'provides the the wrapped component with color values and setter functions as props', () => {
		const withCustomColors = createCustomColorsHOC( [ { name: 'Red', slug: 'red', color: 'ff0000' } ] );
		const EnhancedComponent = withCustomColors( 'backgroundColor' )( () => (
			<div />
		) );

		const wrapper = mount(
			<BlockEditContextProvider
				value={ { attributes: { backgroundColor: null } } }
			>
				<EnhancedComponent />
			</BlockEditContextProvider>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'setting the color to a value in the provided custom color array updated the backgroundColor attribute', () => {
		const withCustomColors = createCustomColorsHOC( [ { name: 'Red', slug: 'red', color: 'ff0000' } ] );
		const EnhancedComponent = withCustomColors( 'backgroundColor' )( ( props ) => (
			<button onClick={ () => props.setBackgroundColor( 'ff0000' ) }>Test Me</button>
		) );

		const setAttributes = jest.fn();

		const wrapper = mount(
			<BlockEditContextProvider
				value={ { attributes: { backgroundColor: null }, setAttributes } }
			>
				<EnhancedComponent />
			</BlockEditContextProvider>
		);

		wrapper.find( 'button' ).simulate( 'click' );
		expect( setAttributes ).toHaveBeenCalledWith( { backgroundColor: 'red', customBackgroundColor: undefined } );
	} );

	it( 'setting the color to a value not in the provided custom color array updates customBackgroundColor attribute', () => {
		const withCustomColors = createCustomColorsHOC( [ { name: 'Red', slug: 'red', color: 'ff0000' } ] );
		const EnhancedComponent = withCustomColors( 'backgroundColor' )( ( props ) => (
			<button onClick={ () => props.setBackgroundColor( '000000' ) }>Test Me</button>
		) );

		const setAttributes = jest.fn();

		const wrapper = mount(
			<BlockEditContextProvider
				value={ { attributes: { backgroundColor: null }, setAttributes } }
			>
				<EnhancedComponent />
			</BlockEditContextProvider>
		);

		wrapper.find( 'button' ).simulate( 'click' );
		expect( setAttributes ).toHaveBeenCalledWith( { backgroundColor: undefined, customBackgroundColor: '000000' } );
	} );
} );
