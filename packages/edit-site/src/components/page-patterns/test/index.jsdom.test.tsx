// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- The module mocks below are intentionally partial.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from '@wordpress/element';
import { act } from 'react'; // eslint-disable-line @typescript-eslint/no-restricted-imports
import { privateApis as routerPrivateApis } from '@wordpress/router';
import DataviewsPatterns from '../index';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderPatterns() {
	const root = createRoot( document.createElement( 'div' ) );
	// eslint-disable-next-line testing-library/no-unnecessary-act
	act( () => root.render( <DataviewsPatterns /> ) );
	return root;
}

vi.hoisted( () => {
	window.matchMedia = () => ( {
		matches: false,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
	} );
} );

const mockNavigate = vi.fn();
let mockOnChangeQueryParams;

vi.mock( import( '@wordpress/views' ), () => ( {
	useViewConfig: () => ( { default_view: {}, default_layouts: {} } ),
	useView: ( { onChangeQueryParams } ) => {
		mockOnChangeQueryParams = onChangeQueryParams;
		return {
			view: { filters: [] },
			updateView: vi.fn(),
			isModified: false,
			resetToDefault: vi.fn(),
		};
	},
} ) );
vi.mock( import( '@wordpress/router' ), () => ( {
	privateApis: { router: true },
} ) );
vi.mock( import( '../../../lock-unlock' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		unlock: ( api ) =>
			api === routerPrivateApis
				? {
						useLocation: () => ( {
							path: '/pattern',
							query: { pageNumber: '1', search: 'foo' },
						} ),
						useHistory: () => ( { navigate: mockNavigate } ),
					}
				: {
						...actual.unlock( api ),
						ExperimentalBlockEditorProvider: ( { children } ) =>
							children,
						usePostActions: () => [],
						usePostFields: () => [],
					},
	};
} );
vi.mock( import( '@wordpress/dataviews' ), () => ( {
	DataViews: () => null,
	filterSortAndPaginate: () => ( {
		data: [],
		paginationInfo: { totalItems: 0, totalPages: 0 },
	} ),
} ) );
vi.mock( import( '@wordpress/admin-ui' ), () => ( {
	Page: ( { children } ) => children,
} ) );
vi.mock( import( '../use-patterns' ), () => ( {
	__esModule: true,
	default: () => ( { patterns: [], isResolving: false } ),
	useAugmentPatternsWithPermissions: ( data ) => data,
} ) );
vi.mock( import( '../use-pattern-settings' ), () => ( {
	default: () => ( {} ),
} ) );
vi.mock( import( '../actions' ), () => ( { default: () => null } ) );
vi.mock( import( '../fields' ), () => ( { previewField: {} } ) );
vi.mock( import( '../../dataviews-actions' ), () => ( {
	useEditPostAction: () => null,
} ) );
vi.mock(
	import( '../../sidebar-navigation-screen-patterns/use-pattern-categories' ),
	() => ( { default: () => ( { patternCategories: [] } ) } )
);

describe( 'DataviewsPatterns', () => {
	beforeEach( () => {
		mockNavigate.mockClear();
	} );

	it( 'removes the search query arg from the URL when the search is empty', () => {
		renderPatterns();
		mockOnChangeQueryParams( { page: 1, search: '' } );

		const url = mockNavigate.mock.calls[ 0 ][ 0 ];
		expect( url ).not.toContain( 'search' );
		expect( url ).toContain( 'pageNumber=1' );
	} );

	it( 'keeps the search query arg in the URL when searching', () => {
		renderPatterns();
		mockOnChangeQueryParams( { page: 1, search: 'bar' } );

		expect( mockNavigate.mock.calls[ 0 ][ 0 ] ).toContain( 'search=bar' );
	} );
} );
