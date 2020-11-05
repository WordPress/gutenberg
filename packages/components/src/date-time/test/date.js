/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import moment from 'moment';

/**
 * Internal dependencies
 */
import DatePicker from '../date';

const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

describe( 'DatePicker', () => {
	it( 'should pass down a moment object for currentDate', () => {
		const currentDate = '1986-10-18T23:00:00';
		const wrapper = shallow( <DatePicker currentDate={ currentDate } /> );
		const date = wrapper.children().props().date;
		expect( moment.isMoment( date ) ).toBe( true );
		expect( date.isSame( moment( currentDate ) ) ).toBe( true );
	} );

	it( 'should pass down a null date when currentDate is set to null', () => {
		const wrapper = shallow( <DatePicker currentDate={ null } /> );
		expect( wrapper.children().props().date ).toBeNull();
	} );

	it( 'should pass down a moment object for now when currentDate is undefined', () => {
		const wrapper = shallow( <DatePicker /> );
		const date = wrapper.children().props().date;
		expect( moment.isMoment( date ) ).toBe( true );
	} );

	describe( 'getMomentDate', () => {
		it( 'should return a Moment object representing a given date string', () => {
			const currentDate = '1986-10-18T23:00:00';
			const wrapper = shallow( <DatePicker /> );
			const momentDate = wrapper.instance().getMomentDate( currentDate );

			expect( moment.isMoment( momentDate ) ).toBe( true );
			expect( momentDate.isSame( moment( currentDate ) ) ).toBe( true );
		} );

		it( 'should return null when given a null agrument', () => {
			const currentDate = null;
			const wrapper = shallow( <DatePicker /> );
			const momentDate = wrapper.instance().getMomentDate( currentDate );

			expect( momentDate ).toBeNull();
		} );

		it( 'should return a Moment object representing now when given an undefined argument', () => {
			const wrapper = shallow( <DatePicker /> );
			const momentDate = wrapper.instance().getMomentDate();

			expect( moment.isMoment( momentDate ) ).toBe( true );
		} );
	} );

	describe( 'onChangeMoment', () => {
		it( 'should call onChange with a formated date of the input', () => {
			const onChangeSpy = jest.fn();
			const currentDate = '1986-10-18T11:00:00';
			const wrapper = shallow(
				<DatePicker
					currentDate={ currentDate }
					onChange={ onChangeSpy }
				/>
			);
			const newDate = moment();

			wrapper.instance().onChangeMoment( newDate );

			expect( onChangeSpy ).toHaveBeenCalledWith(
				newDate.format( TIMEZONELESS_FORMAT )
			);
		} );

		it( 'should call onChange with hours, minutes, seconds of the current time when currentDate is undefined', () => {
			let onChangeSpyArgument;
			const onChangeSpy = ( arg ) => ( onChangeSpyArgument = arg );
			const wrapper = shallow( <DatePicker onChange={ onChangeSpy } /> );
			const newDate = moment( '1986-10-18T11:00:00' );
			const current = moment();
			const newDateWithCurrentTime = newDate.clone().set( {
				hours: current.hours(),
				minutes: current.minutes(),
				seconds: current.seconds(),
			} );
			wrapper.instance().onChangeMoment( newDate );

			expect(
				moment( onChangeSpyArgument ).isSame(
					newDateWithCurrentTime,
					'minute'
				)
			).toBe( true );
		} );

		it( 'should call onChange with hours, minutes, seconds of the current time when currentDate is null', () => {
			let onChangeSpyArgument;
			const onChangeSpy = ( arg ) => ( onChangeSpyArgument = arg );
			const wrapper = shallow(
				<DatePicker currentDate={ null } onChange={ onChangeSpy } />
			);
			const newDate = moment( '1986-10-18T11:00:00' );
			const current = moment();
			const newDateWithCurrentTime = newDate.clone().set( {
				hours: current.hours(),
				minutes: current.minutes(),
				seconds: current.seconds(),
			} );
			wrapper.instance().onChangeMoment( newDate );

			expect(
				moment( onChangeSpyArgument ).isSame(
					newDateWithCurrentTime,
					'minute'
				)
			).toBe( true );
		} );
	} );
} );
