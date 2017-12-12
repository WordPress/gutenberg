/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { LastRevision } from '../';

describe( 'LastRevision', () => {

	it( 'should not render anything if there is only one revision', () => {
		let wrapper = shallow( <LastRevision lastRevisionId={1} revisionsCount={1} /> );
		expect( wrapper.type().WrappedComponent({
			'lastRevisionId': 1,
			'revisionsCount' : 1,
			'children': []
		} ) ).toBe( null );
	} );

	it( 'should render if there are two revisions', () => {
		let wrapper = shallow( <LastRevision lastRevisionId={1} revisionsCount={2} /> );
		expect( wrapper.type().WrappedComponent({
			'lastRevisionId': 1,
			'revisionsCount' : 2,
			'children': []
		} ) ).toEqual( [] );
	} );

} );
