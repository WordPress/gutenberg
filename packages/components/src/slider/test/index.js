/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Slider } from '..';

describe( 'Slider', () => {
	let base;

	beforeEach( () => {
		( { container: base } = render( <Slider /> ) );
	} );

	it( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	it( 'should render valuetext for unit-ed values', () => {
		const { container } = render( <Slider defaultValue="50px" /> );
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	it( 'should fire blur and focus events', async () => {
		const onBlur = jest.fn();
		const onFocus = jest.fn();
		render( <Slider onBlur={ onBlur } onFocus={ onFocus } /> );
		const slider = ( await screen.findAllByRole( 'slider' ) )[ 1 ];
		fireEvent.focusIn( slider );
		expect( onFocus ).toHaveBeenCalledTimes( 1 );
		fireEvent.focusOut( slider );
		expect( onBlur ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should fire onChange with united value', async () => {
		const onChange = jest.fn();
		render( <Slider onChange={ onChange } value="50px" /> );
		const slider = ( await screen.findAllByRole( 'slider' ) )[ 1 ];
		fireEvent.change( slider, { target: { value: '51' } } );
		expect( onChange ).toHaveBeenCalledWith( '51px' );
	} );

	it( 'should fire onChange with non-united value', async () => {
		const onChange = jest.fn();
		render( <Slider onChange={ onChange } value="50" /> );
		const slider = ( await screen.findAllByRole( 'slider' ) )[ 1 ];
		fireEvent.change( slider, { target: { value: '51' } } );
		expect( onChange ).toHaveBeenCalledWith( 51 );
	} );
} );
