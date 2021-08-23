/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MetaBoxesSection } from '../panel-preferences';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

describe( 'MetaBoxesSection', () => {
	it( 'does not render if there are no options', () => {
		useSelect.mockImplementation( () => ( {
			areCustomFieldsRegistered: false,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
			],
		} ) );

		const wrapper = shallow( <MetaBoxesSection /> );
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );

	it( 'renders a Custom Fields option', () => {
		useSelect.mockImplementation( () => ( {
			areCustomFieldsRegistered: true,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
			],
		} ) );

		const wrapper = shallow( <MetaBoxesSection /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'renders meta box options', () => {
		useSelect.mockImplementation( () => ( {
			areCustomFieldsRegistered: false,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
				{ id: 'test1', title: 'Meta Box 1' },
				{ id: 'test2', title: 'Meta Box 2' },
			],
		} ) );

		const wrapper = shallow( <MetaBoxesSection /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'renders a Custom Fields option and meta box options', () => {
		useSelect.mockImplementation( () => ( {
			areCustomFieldsRegistered: true,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
				{ id: 'test1', title: 'Meta Box 1' },
				{ id: 'test2', title: 'Meta Box 2' },
			],
		} ) );

		const wrapper = shallow( <MetaBoxesSection /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
