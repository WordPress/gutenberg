/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { ReusableBlockDeleteButton } from '../reusable-block-delete-button';

describe( 'ReusableBlockDeleteButton', () => {
	function getShallowRenderOutput( element ) {
		const renderer = new ShallowRenderer();
		renderer.render( element );
		return renderer.getRenderOutput();
	}

	it( 'should not render when isVisible is false', () => {
		const wrapper = getShallowRenderOutput(
			<ReusableBlockDeleteButton isVisible={ false } />
		);

		expect( wrapper ).toBe( null );
	} );

	it( 'matches the snapshot', () => {
		const wrapper = getShallowRenderOutput(
			<ReusableBlockDeleteButton
				role="menuitem"
				isVisible
				isDisabled={ false }
				onDelete={ noop }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should allow deleting a reusable block', () => {
		const onDelete = jest.fn();
		const wrapper = getShallowRenderOutput(
			<ReusableBlockDeleteButton
				isVisible
				isDisabled={ false }
				onDelete={ onDelete }
			/>
		);

		wrapper.props.onClick();
		expect( onDelete ).toHaveBeenCalled();
	} );
} );
