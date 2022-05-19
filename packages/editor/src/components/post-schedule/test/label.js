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

	it( 'should show the post will be published immediately if it has a floating date', () => {
		const date = '2018-09-17T01:23:45.678Z';
		const wrapper = shallow(
			<PostScheduleLabel date={ date } isFloating={ true } />
		);
		expect( wrapper.text() ).toBe( 'Immediately' );
	} );

	it( 'should show the scheduled publish date if a date has been set', () => {
		const date = '2018-09-17T01:23:45.678Z';
		const wrapper = shallow(
			<PostScheduleLabel date={ date } isFloating={ false } />
		);
		expect( wrapper.text() ).not.toBe( 'Immediately' );
	} );
} );
