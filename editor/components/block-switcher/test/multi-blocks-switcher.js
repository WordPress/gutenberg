/**
 * External dependencies
 */
import Shallow from 'react-test-renderer/shallow';

const shallowRenderer = new Shallow();

/**
 * Internal dependencies
 */
import { MultiBlocksSwitcher } from '../multi-blocks-switcher';

describe( 'MultiBlocksSwitcher', () => {
	test( 'should return null when the selection is not a multi block selection.', () => {
		const isMultiBlockSelection = false;
		const selectedBlockUids = [
			'an-uid',
		];
		shallowRenderer.render(
			<MultiBlocksSwitcher
				isMultiBlockSelection={ isMultiBlockSelection }
				selectedBlockUids={ selectedBlockUids }
			/>
		);

		expect( shallowRenderer.getRenderOutput() ).toBeNull();
	} );

	test( 'should return a BlockSwitcher element matching the snapshot.', () => {
		const isMultiBlockSelection = true;
		const selectedBlockUids = [
			'an-uid',
			'another-uid',
		];
		shallowRenderer.render(
			<MultiBlocksSwitcher
				isMultiBlockSelection={ isMultiBlockSelection }
				selectedBlockUids={ selectedBlockUids }
			/>
		);

		expect( shallowRenderer.getRenderOutput() ).toMatchSnapshot();
	} );
} );
