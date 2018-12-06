/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DotTip } from '..';

jest.mock( '../../../../../components/src/button' );

describe( 'DotTip', () => {
	it( 'should not render anything if invisible', () => {
		const wrapper = shallow(
			<DotTip>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );

	it( 'should render the tip when non-collapsible', () => {
		const wrapper = shallow(
			<DotTip isVisible>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should render a button when collapsible', () => {
		const wrapper = shallow(
			<DotTip isCollapsible isVisible>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should render a custom label when collapsible', () => {
		const wrapper = shallow(
			<DotTip isCollapsible title="Writing a Letter" isVisible>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should render the tip after being clicked when collapsible', () => {
		const wrapper = shallow(
			<DotTip isCollapsible isVisible>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		const stopPropagation = jest.fn();
		wrapper.find( 'button' ).simulate( 'click', { stopPropagation } );
		wrapper.update();

		expect( wrapper ).toMatchSnapshot();
		expect( stopPropagation ).toHaveBeenCalled();
	} );

	it( 'should call onDismiss when the dismiss button is clicked', () => {
		const onDismiss = jest.fn();
		const wrapper = shallow(
			<DotTip isVisible onDismiss={ onDismiss }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);
		wrapper.find( 'Button[children="Got it"]' ).first().simulate( 'click' );
		expect( onDismiss ).toHaveBeenCalled();
	} );

	it( 'should call onDisable when the X button is clicked', () => {
		const onDisable = jest.fn();
		const wrapper = shallow(
			<DotTip isVisible onDisable={ onDisable }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);
		wrapper.find( 'IconButton[label="Disable tips"]' ).first().simulate( 'click' );
		expect( onDisable ).toHaveBeenCalled();
	} );
} );
