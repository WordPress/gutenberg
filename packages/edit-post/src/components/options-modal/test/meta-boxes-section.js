/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { MetaBoxesSection } from '../meta-boxes-section';

describe( 'MetaBoxesSection', () => {
	it( 'does not render if there are no options', () => {
		const wrapper = shallow(
			<MetaBoxesSection
				areCustomFieldsRegistered={ false }
				metaBoxes={ [ { id: 'postcustom', title: 'This should not render' } ] }
			/>
		);
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );

	it( 'renders a Custom Fields option', () => {
		const wrapper = shallow(
			<MetaBoxesSection
				title="Advanced panels"
				areCustomFieldsRegistered
				metaBoxes={ [ { id: 'postcustom', title: 'This should not render' } ] }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'renders meta box options', () => {
		const wrapper = shallow(
			<MetaBoxesSection
				title="Advanced panels"
				areCustomFieldsRegistered={ false }
				metaBoxes={ [
					{ id: 'postcustom', title: 'This should not render' },
					{ id: 'test1', title: 'Meta Box 1' },
					{ id: 'test2', title: 'Meta Box 2' },
				] }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'renders a Custom Fields option and meta box options', () => {
		const wrapper = shallow(
			<MetaBoxesSection
				title="Advanced panels"
				areCustomFieldsRegistered
				metaBoxes={ [
					{ id: 'postcustom', title: 'This should not render' },
					{ id: 'test1', title: 'Meta Box 1' },
					{ id: 'test2', title: 'Meta Box 2' },
				] }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );
} );
