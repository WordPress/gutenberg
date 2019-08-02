/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { InlineTip } from '../';

describe( 'InlineTip', () => {
	it( 'should not render anything if invisible', () => {
		const wrapper = shallow(
			<InlineTip isTipVisible={ false } hasDismissedAnyTips={ false }>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		expect( wrapper.children() ).toHaveLength( 0 );
	} );

	it( 'should render correctly', () => {
		const wrapper = shallow(
			<InlineTip isTipVisible hasDismissedAnyTips={ false }>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'calls `onDismissTip` when the tip is dismissed and a tip has already been dismissed', () => {
		const onDismissTip = jest.fn();
		const wrapper = mount(
			<InlineTip isTipVisible onDismissTip={ onDismissTip } hasDismissedAnyTips>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		wrapper.find( 'button[aria-label="Dismiss this notice"]' ).simulate( 'click' );
		expect( onDismissTip ).toHaveBeenCalled();
	} );

	it( 'calls `onDismissTip` when the tip and confirmation are dismissed', () => {
		const onDismissTip = jest.fn();
		const wrapper = mount(
			<InlineTip isTipVisible onDismissTip={ onDismissTip } hasDismissedAnyTips={ false }>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		wrapper.find( 'button[aria-label="Dismiss this notice"]' ).simulate( 'click' );
		wrapper.find( 'button' ).find( { children: 'No' } ).simulate( 'click' );
		expect( onDismissTip ).toHaveBeenCalled();
	} );

	it( 'calls `onDisableTips` when the tip is dismissed and the confirmation is accepted', () => {
		const onDisableTips = jest.fn();
		const wrapper = mount(
			<InlineTip isTipVisible onDisableTips={ onDisableTips } hasDismissedAnyTips={ false }>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		wrapper.find( 'button[aria-label="Dismiss this notice"]' ).simulate( 'click' );
		wrapper.find( 'button' ).find( { children: 'Disable Tips' } ).simulate( 'click' );
		expect( onDisableTips ).toHaveBeenCalled();
	} );
} );
