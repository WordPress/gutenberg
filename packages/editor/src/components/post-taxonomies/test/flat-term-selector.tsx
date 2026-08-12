import { render } from '@testing-library/react';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { FlatTermSelector } from '../flat-term-selector';

describe( 'FlatTermSelector', () => {
	const taxonomy = {
		name: 'Types',
		slug: 'type',
		rest_base: 'type',
		hierarchical: false,
	};

	beforeEach( () => {
		jest.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue(
			taxonomy
		);
		jest.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			[]
		);
		jest.spyOn(
			select( coreStore ),
			'hasFinishedResolution'
		).mockReturnValue( true );
	} );

	it( 'should not read the taxonomy post attribute without an assign action', () => {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );
		const getEditedPostAttribute = jest
			.spyOn( select( editorStore ), 'getEditedPostAttribute' )
			.mockReturnValue( 'post' );

		render( <FlatTermSelector slug="type" /> );

		expect( getEditedPostAttribute ).not.toHaveBeenCalled();
	} );

	it( 'should read the taxonomy post attribute when an assign action exists', () => {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-assign-type_terms': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/posts/1/assign-type_terms',
					},
				],
			},
		} );
		jest.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue( {
			...taxonomy,
			rest_base: 'type_terms',
		} );
		const getEditedPostAttribute = jest
			.spyOn( select( editorStore ), 'getEditedPostAttribute' )
			.mockReturnValue( [] );

		render( <FlatTermSelector slug="type" /> );

		expect( getEditedPostAttribute ).toHaveBeenCalledWith( 'type_terms' );
	} );
} );
