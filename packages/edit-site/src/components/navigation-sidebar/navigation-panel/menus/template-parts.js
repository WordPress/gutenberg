/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_ROOT, MENU_TEMPLATE_PARTS } from '../constants';

export default function TemplatePartsMenu() {
	const templateParts = useSelect( ( select ) => {
		const publishedTemplateParts = select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish' ],
				per_page: -1,
			}
		);
		const currentTheme = select( 'core' ).getCurrentTheme()?.stylesheet;
		const themeTemplateParts = select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'auto-draft' ],
				per_page: -1,
				theme: currentTheme,
			}
		);
		// Results above can be 'null' in early steps of editor loading,
		// so we must check before using the spread operator to combine them.
		const combinedTemplateParts = [];
		if ( publishedTemplateParts ) {
			combinedTemplateParts.push( ...publishedTemplateParts );
		}
		if ( themeTemplateParts ) {
			combinedTemplateParts.push( ...themeTemplateParts );
		}
		return combinedTemplateParts;
	}, [] );

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATE_PARTS }
			title={ __( 'Template Parts' ) }
			parentMenu={ MENU_ROOT }
		>
			{ map( templateParts, ( templatePart ) => (
				<TemplateNavigationItem
					item={ templatePart }
					key={ `wp_template_part-${ templatePart.id }` }
				/>
			) ) }

			{ ! templateParts && <NavigationItem title={ __( 'Loading…' ) } /> }
		</NavigationMenu>
	);
}
