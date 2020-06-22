/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../index';
import { items } from './fixtures';

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( { installBlockType: jest.fn() } ),
} ) );

describe( 'DownloadableBlocksList', () => {
	describe( 'List rendering', () => {
		it( 'should render and empty list', () => {
			const wrapper = shallow(
				<DownloadableBlocksList
					items={ [] }
					onSelect={ jest.fn() }
					onHover={ jest.fn() }
					isLoading={ false }
				/>
			);
			expect( wrapper.isEmptyRender() ).toBe( true );
		} );

		it( 'should render plugins items into the list', () => {
			const wrapper = shallow(
				<DownloadableBlocksList
					items={ items }
					onSelect={ jest.fn() }
					onHover={ jest.fn() }
					isLoading={ false }
				/>
			);
			expect( wrapper ).toMatchSnapshot();
		} );
	} );
} );
