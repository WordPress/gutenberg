/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { alignCenter, alignLeft, alignRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockControls from '../';
import BlockEdit from '../../block-edit';

describe( 'BlockControls', () => {
	const controls = [
		{
			icon: alignLeft,
			title: 'Align left',
			align: 'left',
		},
		{
			icon: alignCenter,
			title: 'Align center',
			align: 'center',
		},
		{
			icon: alignRight,
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
