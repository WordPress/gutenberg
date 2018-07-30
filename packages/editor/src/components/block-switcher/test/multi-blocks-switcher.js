/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { MultiBlocksSwitcher } from '../multi-blocks-switcher';

describe( 'MultiBlocksSwitcher', () => {
	test( 'should return null when the selection is not a multi block selection.', () => {
		const isMultiBlockSelection = false;
		const selectedBlockClientIds = [
			'clientid',
		];
		const wrapper = shallow(
			<MultiBlocksSwitcher
				isMultiBlockSelection={ isMultiBlockSelection }
				selectedBlockClientIds={ selectedBlockClientIds }
			/>
		);

		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should return a BlockSwitcher element matching the snapshot.', () => {
		const isMultiBlockSelection = true;
		const selectedBlockClientIds = [
			'clientid-1',
			'clientid-2',
		];
		const wrapper = shallow(
			<MultiBlocksSwitcher
				isMultiBlockSelection={ isMultiBlockSelection }
				selectedBlockClientIds={ selectedBlockClientIds }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
