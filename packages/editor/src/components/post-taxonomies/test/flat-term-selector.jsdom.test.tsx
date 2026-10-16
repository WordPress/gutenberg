import { render } from '@testing-library/react';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store as editorStore } from '@wordpress/editor';
import { FlatTermSelector } from '../flat-term-selector';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'FlatTermSelector', () => {
	const taxonomy = {
		name: 'Types',
		slug: 'type',
		rest_base: 'type',
		hierarchical: false,
	};

	beforeEach( () => {
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue(
			taxonomy
		);
		vi.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			[]
		);
		vi.spyOn(
			select( coreStore ),
			'hasFinishedResolution'
		).mockReturnValue( true );
	} );

	it( 'should not read the taxonomy post attribute without an assign action', () => {
		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );
		const getEditedPostAttribute = vi
			.spyOn( select( editorStore ), 'getEditedPostAttribute' )
			.mockReturnValue( 'post' );

		render( <FlatTermSelector slug="type" /> );

		expect( getEditedPostAttribute ).not.toHaveBeenCalled();
	} );

	it( 'should read the taxonomy post attribute when an assign action exists', () => {
		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-assign-type_terms': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/posts/1/assign-type_terms',
					},
				],
			},
		} );
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue( {
			...taxonomy,
			rest_base: 'type_terms',
		} );
		const getEditedPostAttribute = vi
			.spyOn( select( editorStore ), 'getEditedPostAttribute' )
			.mockReturnValue( [] );

		render( <FlatTermSelector slug="type" /> );

		expect( getEditedPostAttribute ).toHaveBeenCalledWith( 'type_terms' );
	} );
} );
