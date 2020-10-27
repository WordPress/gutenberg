/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useTemplateInfo from '../use-template-info';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

describe( 'useTemplateInfo', () => {
	useSelect.mockImplementation( () => ( {
		index: {
			title: 'Default (Index)',
			description:
				'Main template, applied when no other template is found',
		},
	} ) );

	it( 'should return an empty object if no template is passed', () => {
		expect( useTemplateInfo( null ) ).toEqual( {} );
		expect( useTemplateInfo( undefined ) ).toEqual( {} );
		expect( useTemplateInfo( false ) ).toEqual( {} );
	} );

	it( 'should return the default title if none is defined on the template', () => {
		expect( useTemplateInfo( { slug: 'index' } ).title ).toEqual(
			'Default (Index)'
		);
	} );

	it( 'should return the rendered title if defined on the template', () => {
		expect(
			useTemplateInfo( {
				slug: 'index',
				title: { rendered: 'test title' },
			} ).title
		).toEqual( 'test title' );
	} );

	it( 'should return the slug if no title is found', () => {
		expect(
			useTemplateInfo( { slug: 'not a real template' } ).title
		).toEqual( 'not a real template' );
	} );

	it( 'should return the default description if none is defined on the template', () => {
		expect( useTemplateInfo( { slug: 'index' } ).description ).toEqual(
			'Main template, applied when no other template is found'
		);
	} );

	it( 'should return the raw excerpt as description if defined on the template', () => {
		expect(
			useTemplateInfo( {
				slug: 'index',
				excerpt: { raw: 'test description' },
			} ).description
		).toEqual( 'test description' );
	} );

	it( 'should return both a title and a description', () => {
		expect( useTemplateInfo( { slug: 'index' } ) ).toEqual( {
			title: 'Default (Index)',
			description:
				'Main template, applied when no other template is found',
		} );

		expect(
			useTemplateInfo( {
				slug: 'index',
				title: { rendered: 'test title' },
			} )
		).toEqual( {
			title: 'test title',
			description:
				'Main template, applied when no other template is found',
		} );

		expect(
			useTemplateInfo( {
				slug: 'index',
				excerpt: { raw: 'test description' },
			} )
		).toEqual( {
			title: 'Default (Index)',
			description: 'test description',
		} );

		expect(
			useTemplateInfo( {
				slug: 'index',
				title: { rendered: 'test title' },
				excerpt: { raw: 'test description' },
			} )
		).toEqual( {
			title: 'test title',
			description: 'test description',
		} );
	} );
} );
