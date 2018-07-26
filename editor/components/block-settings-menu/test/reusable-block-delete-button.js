/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { ReusableBlockDeleteButton } from '../reusable-block-delete-button';

describe( 'ReusableBlockDeleteButton', () => {
	it( 'matches the snapshot', () => {
		const wrapper = shallow(
			<ReusableBlockDeleteButton
				role="menuitem"
				reusableBlock={ { id: 123 } }
				onDelete={ noop }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should allow deleting a reusable block', () => {
		const onDelete = jest.fn();
		const wrapper = shallow(
			<ReusableBlockDeleteButton
				reusableBlock={ { id: 123 } }
				onDelete={ onDelete }
			/>
		);

		wrapper.find( 'IconButton' ).simulate( 'click' );
		expect( onDelete ).toHaveBeenCalledWith( 123 );
	} );
} );
