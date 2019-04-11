/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import TimePicker from '../time';

describe( 'TimePicker', () => {
	it( 'matches the snapshot when the is12hour prop is true', () => {
		const wrapper = shallow( <TimePicker currentTime="1986-10-18T23:00:00" is12Hour={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the is12hour prop is false', () => {
		const wrapper = shallow( <TimePicker currentTime="1986-10-18T23:00:00" is12Hour={ false } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the is12hour prop is specified', () => {
		const wrapper = shallow( <TimePicker currentTime="1986-10-18T23:00:00" is12Hour /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the is12hour prop is undefined', () => {
		const wrapper = shallow( <TimePicker currentTime="1986-10-18T23:00:00" /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should call onChange with an updated day', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-day-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '10' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-10T11:00:00' );
	} );

	it( 'should call onChange with an updated month', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-month-select' ).at( 0 );
		input.simulate( 'change', { target: { value: '12' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-12-18T11:00:00' );
	} );

	it( 'should call onChange with an updated year', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-year-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '2018' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-10-18T11:00:00' );
	} );

	it( 'should call onChange with an updated hour (12-hour clock)', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-hours-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '10' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T10:00:00' );
	} );

	it( 'should not call onChange with an updated hour (12-hour clock) if the hour is out of bounds', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-hours-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '22' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should call onChange with an updated hour (24-hour clock)', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour={ false } /> );
		const input = picker.find( '.components-datetime__time-field-hours-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '22' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T22:00:00' );
	} );

	it( 'should call onChange with an updated minute', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-minutes-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '10' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T11:10:00' );
	} );

	it( 'should not call onChange with an updated minute if out of bounds', () => {
		const onChangeSpy = jest.fn();
		const picker = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const input = picker.find( '.components-datetime__time-field-minutes-input' ).at( 0 );
		input.simulate( 'change', { target: { value: '99' } } );
		input.simulate( 'blur' );
		expect( onChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should switch to PM correctly', () => {
		const onChangeSpy = jest.fn();
		const button = shallow( <TimePicker currentTime="1986-10-18T11:00:00" onChange={ onChangeSpy } is12Hour /> );
		const pmButton = button.find( '.components-datetime__time-pm-button' );
		pmButton.simulate( 'click' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T23:00:00' );
	} );

	it( 'should switch to AM correctly', () => {
		const onChangeSpy = jest.fn();
		const button = shallow( <TimePicker currentTime="1986-10-18T23:00:00" onChange={ onChangeSpy } is12Hour /> );
		const pmButton = button.find( '.components-datetime__time-am-button' );
		pmButton.simulate( 'click' );
		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T11:00:00' );
	} );
} );
