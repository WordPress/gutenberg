/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import BlockControls from '../';
import BlockEdit from '../../block-edit';

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

	it( 'should render a dynamic toolbar of controls', () => {
		const wrapper = shallow(
			<BlockEdit isSelected>
				<BlockControls controls={ controls }>
					<p>Child</p>
				</BlockControls>
			</BlockEdit>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
