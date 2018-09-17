/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostScheduleLabel } from '../label';

describe( 'PostScheduleLabel', () => {
	it( 'should show the post will be published immediately if no publish date is set', () => {
		const wrapper = shallow( <PostScheduleLabel date={ undefined } /> );
		expect( wrapper.text() ).toBe( 'Immediately' );
	} );

	it( 'should show the post will be published immediately if in draft status and the date and modified date match', () => {
		const date = '2018-09-17T01:23:45.678Z';
		const wrapper = shallow( <PostScheduleLabel date={ date } modified={ date } status={ 'draft' } /> );
		expect( wrapper.text() ).toBe( 'Immediately' );
	} );

	it( 'should show the post will be published immediately if in auto-draft status and the date and modified date match', () => {
		const date = '2018-09-17T01:23:45.678Z';
		const wrapper = shallow( <PostScheduleLabel date={ date } modified={ date } status={ 'auto-draft' } /> );
		expect( wrapper.text() ).toBe( 'Immediately' );
	} );

	it( 'should show the scheduled publish date if a date has been set', () => {
		const date = '2018-09-17T01:23:45.678Z';
		const modified = '2018-08-01T00:00:00.000Z';
		const wrapper = shallow( <PostScheduleLabel date={ date } modified={ modified } status={ 'draft' } /> );
		expect( wrapper.text() ).not.toBe( 'Immediately' );
	} );
} );
