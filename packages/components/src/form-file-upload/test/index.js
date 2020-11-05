/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import FormFileUpload from '../';

describe( 'FormFileUpload', () => {
	it( 'should show an Icon Button and a hidden input', () => {
		const wrapper = shallow(
			<FormFileUpload
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			>
				My Upload Button
			</FormFileUpload>
		);

		const button = wrapper.find( 'ForwardRef(Button)' );
		const input = wrapper.find( 'input' );
		expect( button.prop( 'children' ) ).toBe( 'My Upload Button' );
		expect( input.prop( 'style' ).display ).toBe( 'none' );
	} );
} );
