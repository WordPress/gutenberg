import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSelect } from '@wordpress/data';
import DownloadableBlocksList from '../';
import { items } from '../../test/fixtures';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// This allows us to tweak the returned value on each test.
	useSelect: vi.fn(),
	useDispatch: () => ( { installBlockType: vi.fn() } ),
} ) );

describe( 'DownloadableBlocksList', () => {
	describe( 'List rendering', () => {
		beforeEach( () => {
			useSelect.mockReturnValue( {
				isLoading: false,
				isInstallable: true,
			} );
		} );

		it( 'should render an empty list', () => {
			const { container } = render(
				<DownloadableBlocksList
					items={ [] }
					onSelect={ vi.fn() }
					onHover={ vi.fn() }
				/>
			);

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should render plugins items into the list', () => {
			render(
				<DownloadableBlocksList
					items={ items }
					onSelect={ vi.fn() }
					onHover={ vi.fn() }
				/>
			);
			const downloadableBlocks = screen.getAllByRole( 'option' );

			expect( downloadableBlocks ).toHaveLength( items.length );
		} );
	} );
} );
