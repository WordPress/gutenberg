/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import { ReusableBlockConvertButton } from '../reusable-block-convert-button';

describe( 'ReusableBlockConvertButton', () => {
	function getShallowRenderOutput( element ) {
		const renderer = new ShallowRenderer();
		renderer.render( element );
		return renderer.getRenderOutput();
	}

	it( 'should not render when isVisible false', () => {
		const wrapper = getShallowRenderOutput(
			<ReusableBlockConvertButton isVisible={ false } />
		);
		expect( wrapper ).toBe( null );
	} );

	it( 'should allow converting a static block to a reusable block', () => {
		const onConvert = jest.fn();
		const wrapper = getShallowRenderOutput(
			<ReusableBlockConvertButton
				isVisible
				isReusable={ false }
				onConvertToReusable={ onConvert }
			/>
		);
		expect( wrapper.props.children[ 1 ] ).toBeFalsy();
		const button = wrapper.props.children[ 0 ];
		expect( button.props.children ).toBe( 'Add to Reusable Blocks' );
		button.props.onClick();
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow converting a reusable block to static', () => {
		const onConvert = jest.fn();
		const wrapper = getShallowRenderOutput(
			<ReusableBlockConvertButton
				isVisible
				isReusable
				onConvertToStatic={ onConvert }
			/>
		);
		expect( wrapper.props.children[ 0 ] ).toBeFalsy();
		const button = wrapper.props.children[ 1 ];
		expect( button.props.children ).toBe( 'Convert to Regular Block' );
		button.props.onClick();
		expect( onConvert ).toHaveBeenCalled();
	} );
} );
