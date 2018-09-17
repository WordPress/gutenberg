/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { ReusableBlockConvertButton } from '../reusable-block-convert-button';

describe( 'ReusableBlockConvertButton', () => {
	it( 'should not render when isVisible false', () => {
		const wrapper = shallow(
			<ReusableBlockConvertButton isVisible={ false } />
		);
		expect( wrapper.children() ).not.toExist();
	} );

	it( 'should allow converting a static block to a reusable block', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<ReusableBlockConvertButton
				isVisible
				isStaticBlock
				onConvertToReusable={ onConvert }
			/>
		);
		const button = wrapper.find( 'MenuItem' ).first();
		expect( button.children().text() ).toBe( 'Add to Reusable Blocks' );
		button.simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow converting a reusable block to static', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<ReusableBlockConvertButton
				isVisible
				isStaticBlock={ false }
				onConvertToStatic={ onConvert }
			/>
		);
		const button = wrapper.find( 'MenuItem' ).first();
		expect( button.children().text() ).toBe( 'Convert to Regular Block' );
		button.simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );
} );
