/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostAuthorCheck } from '../check';

describe( 'PostAuthorCheck', () => {
	it( 'should not render anything if has no authors', () => {
		const wrapper = shallow(
			<PostAuthorCheck
				hasAuthors={ false }
				hasAssignAuthorAction={ true }
			>
				authors
			</PostAuthorCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( "should not render anything if doesn't have author action", () => {
		const wrapper = shallow(
			<PostAuthorCheck
				hasAuthors={ true }
				hasAssignAuthorAction={ false }
			>
				authors
			</PostAuthorCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render control', () => {
		const wrapper = shallow(
			<PostAuthorCheck hasAuthors={ true } hasAssignAuthorAction={ true }>
				authors
			</PostAuthorCheck>
		);

		expect( wrapper.type() ).not.toBe( null );
	} );
} );
