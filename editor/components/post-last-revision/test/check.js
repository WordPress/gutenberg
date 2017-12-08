/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostLastRevisionCheck } from '../../';

describe( 'PostLastRevisionCheck', () => {
	const lastRevisionId = 0;
	const revisionsCount = 0;

	it( 'should not render anything if there is only one revision', () => {
		let wrapper = shallow( <PostLastRevisionCheck lastRevisionId={1} revisionsCount={1} /> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render anything if there are two revisions', () => {
		let wrapper = shallow( <PostLastRevisionCheck lastRevisionId={1} revisionsCount={2} /> );
		expect( wrapper.type() ).toNotBe( null );
	} );


} );
