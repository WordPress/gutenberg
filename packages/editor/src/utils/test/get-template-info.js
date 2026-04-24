/**
 * WordPress dependencies
 */
import { footer, header, layout } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../get-template-info';

describe( '__experimentalGetTemplateInfo', () => {
	const defaultTemplateTypes = [
		{
			title: 'Default (Index)',
			description: 'Main template',
			slug: 'index',
		},
		{
			title: '404 (Not Found)',
			description: 'Applied when content cannot be found',
			slug: '404',
		},
	];

	const defaultTemplatePartAreas = [
		{
			area: 'header',
			label: 'Header',
			description: 'Some description of a header',
			icon: 'header',
		},
		{
			area: 'footer',
			label: 'Footer',
			description: 'Some description of a footer',
			icon: 'footer',
		},
	];

	it( 'should return an empty object if no template is passed', () => {
		expect( getTemplateInfo( undefined ) ).toEqual( {} );
		expect( getTemplateInfo( null ) ).toEqual( {} );
		expect( getTemplateInfo( false ) ).toEqual( {} );
	} );

	it( 'should return the default title if none is defined on the template', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
				},
			} ).title
		).toEqual( 'Default (Index)' );
	} );

	it( 'should return the rendered title if defined on the template', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
					title: { rendered: 'test title' },
				},
			} ).title
		).toEqual( 'test title' );
	} );

	it( 'should return the slug if no title is found', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'not a real template',
				},
			} ).title
		).toEqual( 'not a real template' );
	} );

	it( 'should return the default description if none is defined on the template', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
				},
			} ).description
		).toEqual( 'Main template' );
	} );

	it( 'should return the raw excerpt as description if defined on the template', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
					description: { raw: 'test description' },
				},
			} ).description
		).toEqual( 'test description' );
	} );

	it( 'should return a title, description, and icon', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: { slug: 'index' },
			} )
		).toEqual( {
			title: 'Default (Index)',
			description: 'Main template',
			icon: layout,
		} );

		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
					title: { rendered: 'test title' },
				},
			} )
		).toEqual( {
			title: 'test title',
			description: 'Main template',
			icon: layout,
		} );

		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
					description: { raw: 'test description' },
				},
			} )
		).toEqual( {
			title: 'Default (Index)',
			description: 'test description',
			icon: layout,
		} );

		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'index',
					title: { rendered: 'test title' },
					description: { raw: 'test description' },
				},
			} )
		).toEqual( {
			title: 'test title',
			description: 'test description',
			icon: layout,
		} );
	} );

	it( 'should return correct icon based on area', () => {
		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'template part, area = uncategorized',
					area: 'uncategorized',
				},
			} )
		).toEqual( {
			title: 'template part, area = uncategorized',
			icon: layout,
		} );

		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'template part, area = invalid',
					area: 'invalid',
				},
			} )
		).toEqual( {
			title: 'template part, area = invalid',
			icon: layout,
		} );

		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'template part, area = header',
					area: 'header',
				},
			} )
		).toEqual( {
			title: 'template part, area = header',
			icon: header,
		} );

		expect(
			getTemplateInfo( {
				templateAreas: defaultTemplatePartAreas,
				templateTypes: defaultTemplateTypes,
				template: {
					slug: 'template part, area = footer',
					area: 'footer',
				},
			} )
		).toEqual( {
			title: 'template part, area = footer',
			icon: footer,
		} );
	} );
} );
