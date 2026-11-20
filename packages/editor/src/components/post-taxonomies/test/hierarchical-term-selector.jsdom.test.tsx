import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { describe, expect, it, vi } from 'vitest';
import { store as editorStore } from '@wordpress/editor';
import { HierarchicalTermSelector } from '../hierarchical-term-selector';

const TestHierarchicalTermSelector =
	HierarchicalTermSelector as unknown as ComponentType< { slug: string } >;

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'HierarchicalTermSelector', () => {
	it( 'should not read the taxonomy post attribute without an assign action', () => {
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue( {
			name: 'Types',
			slug: 'type',
			rest_base: 'type',
			hierarchical: true,
		} );
		vi.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			[]
		);
		vi.spyOn( select( coreStore ), 'isResolving' ).mockReturnValue( false );
		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );

		const getEditedPostAttribute = vi
			.spyOn( select( editorStore ), 'getEditedPostAttribute' )
			.mockReturnValue( 'post' );

		render( <TestHierarchicalTermSelector slug="type" /> );

		expect( getEditedPostAttribute ).not.toHaveBeenCalled();
	} );
} );
