/**
 * Internal dependencies
 */
import { enhanceNavigationLinkVariations } from '../hooks';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

describe( 'hooks', () => {
	describe( 'enhanceNavigationLinkVariations', () => {
		it( 'does not modify settings when settings do not belong to a navigation link', () => {
			const updatedSettings = enhanceNavigationLinkVariations(
				{
					name: 'core/test',
					one: 'one',
					two: 'two',
					three: 'three',
				},
				'core/test'
			);
			expect( updatedSettings ).toEqual( {
				name: 'core/test',
				one: 'one',
				two: 'two',
				three: 'three',
			} );
		} );
		it( 'adds fallback variations when variations are missing', () => {
			const updatedSettings = enhanceNavigationLinkVariations(
				{
					name: 'core/navigation-link',
					one: 'one',
					two: 'two',
					three: 'three',
				},
				'core/navigation-link'
			);
			expect( updatedSettings ).toMatchSnapshot();
		} );
		it( 'enhances variations with icon and isActive functions', () => {
			const updatedSettings = enhanceNavigationLinkVariations(
				{
					name: 'core/navigation-link',
					extraProp: 'extraProp',
					variations: [
						{
							name: 'link',
							title: __( 'Custom Link' ),
							description: __( 'A link to a custom URL.' ),
							attributes: {},
						},
						{
							name: 'post',
							title: __( 'Post Link' ),
							description: __( 'A link to a post.' ),
							attributes: { type: 'post' },
						},
						{
							name: 'page',
							title: __( 'Page Link' ),
							description: __( 'A link to a page.' ),
							attributes: { type: 'page' },
						},
						{
							name: 'category',
							title: __( 'Category Link' ),
							description: __( 'A link to a category.' ),
							attributes: { type: 'category' },
						},
						{
							name: 'tag',
							title: __( 'Tag Link' ),
							description: __( 'A link to a tag.' ),
							attributes: { type: 'tag' },
						},
					],
				},
				'core/navigation-link'
			);
			expect( updatedSettings ).toMatchSnapshot();
		} );
	} );
} );
