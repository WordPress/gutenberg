/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockControls } from '../';

describe( 'BlockControls', () => {
	const controls = [
		{
			icon: 'editor-alignleft',
			title: 'Align left',
			align: 'left',
		},
		{
			icon: 'editor-aligncenter',
			title: 'Align center',
			align: 'center',
		},
		{
			icon: 'editor-alignright',
			title: 'Align right',
			align: 'right',
		},
	];

	test( 'Should render a dynamic toolbar of controls', () => {
		expect( shallow( <BlockControls controls={ controls } children={ <p>Child</p> } /> ) ).toMatchSnapshot();
	} );
} );
