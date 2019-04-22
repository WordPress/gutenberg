/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { EditorNotices } from '../';

describe( 'EditorNotices', () => {
	const notices = [
		{ content: 'Eat your vegetables!', isDismissible: true },
		{ content: 'Brush your teeth!', isDismissible: true },
		{ content: 'Existence is fleeting!', isDismissible: false },
	];

	it( 'renders all notices', () => {
		const wrapper = shallow( <EditorNotices notices={ notices } /> );
		expect( wrapper.prop( 'notices' ) ).toHaveLength( 3 );
		expect( wrapper.children() ).toHaveLength( 1 );
	} );

	it( 'renders only dismissible notices', () => {
		const wrapper = shallow( <EditorNotices notices={ notices } dismissible={ true } /> );
		expect( wrapper.prop( 'notices' ) ).toHaveLength( 2 );
		expect( wrapper.children() ).toHaveLength( 1 );
	} );

	it( 'renders only non-dismissible notices', () => {
		const wrapper = shallow( <EditorNotices notices={ notices } dismissible={ false } /> );
		expect( wrapper.prop( 'notices' ) ).toHaveLength( 1 );
		expect( wrapper.children() ).toHaveLength( 0 );
	} );
} );
