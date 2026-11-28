import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRegistry, useSelect } from '@wordpress/data';
import PageAttributesPanel from '../panel';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '../parent' ), () => ( {
	ParentRow: () => <button>Edit Parent</button>,
} ) );

describe( 'PageAttributesPanel', () => {
	it.each( [
		[ 'hierarchical', { hierarchical: true }, true, true ],
		[ 'non-hierarchical', { hierarchical: false }, true, false ],
		[ 'loading', undefined, true, false ],
		[ 'disabled', { hierarchical: true }, false, false ],
	] as const )(
		'sets parent control visibility for %s post types',
		( _, type, enabled, visible ) => {
			vi.mocked( useSelect ).mockImplementation( ( mapSelect ) => {
				if ( typeof mapSelect !== 'function' ) {
					throw new Error( 'Expected a selector callback' );
				}
				return mapSelect(
					vi.fn().mockReturnValue( {
						getEditedPostAttribute: () => 'custom',
						getPostType: () =>
							type && {
								...type,
								supports: { 'page-attributes': true },
							},
						isEditorPanelEnabled: () => enabled,
					} ),
					createRegistry()
				);
			} );

			render( <PageAttributesPanel /> );

			expect(
				screen.queryByRole( 'button', { name: 'Edit Parent' } ) !== null
			).toBe( visible );
		}
	);
} );
