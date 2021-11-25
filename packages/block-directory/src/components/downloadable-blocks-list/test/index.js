/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../';
import { items } from '../../test/fixtures';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( { installBlockType: jest.fn() } ),
} ) );

describe( 'DownloadableBlocksList', () => {
	describe( 'List rendering', () => {
		useSelect.mockImplementation( () => ( {
			isLoading: false,
			isInstallable: true,
		} ) );

		it( 'should render and empty list', () => {
			const { container } = render(
				<DownloadableBlocksList
					items={ [] }
					onSelect={ jest.fn() }
					onHover={ jest.fn() }
				/>
			);

			expect( container.firstChild ).toBe( null );
		} );

		it( 'should render plugins items into the list', () => {
			const { getAllByRole } = render(
				<DownloadableBlocksList
					items={ items }
					onSelect={ jest.fn() }
					onHover={ jest.fn() }
				/>
			);
			const downloadableBlocks = getAllByRole( 'option' );

			expect( downloadableBlocks ).toHaveLength( items.length );
		} );
	} );
} );
