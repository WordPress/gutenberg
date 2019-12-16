/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';

export default function TemplateSwitcher( {
	ids,
	templatePartIds,
	activeId,
	isTemplatePart,
	onActiveIdChange,
	onActiveTemplatePartIdChange,
} ) {
	const { templates, templateParts } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			return {
				templates: ids.map( ( id ) => {
					const template = getEntityRecord( 'postType', 'wp_template', id );
					return {
						label: template ? template.slug : __( 'loading…' ),
						value: id,
					};
				} ),
				templateParts: templatePartIds.map( ( id ) => {
					const template = getEntityRecord( 'postType', 'wp_template_part', id );
					return {
						label: template ? template.slug : __( 'loading…' ),
						value: id,
					};
				} ),
			};
		},
		[ ids, templatePartIds ]
	);
	return (
		<DropdownMenu
			icon="layout"
			label={ __( 'Switch Template' ) }
			className="edit-site-template-switcher"
		>
			{ () => (
				<>
					<MenuGroup label={ __( 'Templates' ) }>
						<MenuItemsChoice
							choices={ templates }
							value={ ! isTemplatePart ? activeId : undefined }
							onSelect={ onActiveIdChange }
						/>
					</MenuGroup>
					<MenuGroup label={ __( 'Template Parts' ) }>
						<MenuItemsChoice
							choices={ templateParts }
							value={ isTemplatePart ? activeId : undefined }
							onSelect={ onActiveTemplatePartIdChange }
						/>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
