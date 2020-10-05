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
import TemplateNavigationItems from '../template-navigation-items';

export default function TemplatePartsMenu( { onActiveTemplatePartIdChange } ) {
	const templateParts = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template_part' ),
		[]
	);

	return (
		<NavigationMenu
			menu="template-parts"
			title="Template Parts"
			parentMenu="root"
		>
			<TemplateNavigationItems
				entityType="wp_template_part"
				templates={ templateParts }
				onActivate={ onActiveTemplatePartIdChange }
			/>

			{ ! templateParts && <NavigationItem title={ __( 'Loading…' ) } /> }
		</NavigationMenu>
	);
}
