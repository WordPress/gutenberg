/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { create } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FinishButton from '../finish-button';

describe( 'FinishButton', () => {
	it( 'renders a button', () => {
		const wrapper = shallow( <FinishButton /> );
		expect( wrapper.find( Button ) ).toHaveLength( 1 );
	} );

	it( 'calls onClick when the button is clicked', () => {
		const onClick = jest.fn();
		const wrapper = shallow( <FinishButton onClick={ onClick } /> );
		wrapper.find( Button ).prop( 'onClick' )();
		expect( onClick ).toHaveBeenCalled();
	} );

	it( 'receives focus on mount when nothing is focused', () => {
		const focus = jest.fn();
		create( <FinishButton />, {
			createNodeMock: () => ( { focus } ),
		} );
		expect( focus ).toHaveBeenCalled();
	} );

	it( 'does not receive focus on mount when something is already focused', () => {
		const button = document.createElement( 'button' );
		document.body.append( button );
		button.focus();

		const focus = jest.fn();
		create( <FinishButton />, {
			createNodeMock: () => ( { focus } ),
		} );
		expect( focus ).not.toHaveBeenCalled();
	} );
} );
