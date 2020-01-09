/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BlockNavigationDropdown, ToolSelector } from '@wordpress/block-editor';
import { DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useEditorContext } from '../editor';
import TemplateSwitcher from '../template-switcher';
import SaveButton from '../save-button';
import ThemeExporter from '../theme-exporter';

export default function Header() {
	const { settings, setSettings } = useEditorContext();
	const setActiveTemplateId = useCallback(
		( newTemplateId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplateId,
				templateType: 'wp_template',
			} ) ),
		[]
	);
	const setActiveTemplatePartId = useCallback(
		( newTemplatePartId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplatePartId,
				templateType: 'wp_template_part',
			} ) ),
		[]
	);
	const addTemplateId = useCallback(
		( newTemplateId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplateId,
				templateIds: [ ...prevSettings.templateIds, newTemplateId ],
			} ) ),
		[]
	);
	return (
		<div
			className="edit-site-header"
			role="region"
			aria-label={ __( 'Site editor top bar.' ) }
			tabIndex="-1"
		>
			<div className="edit-site-header__toolbar">
				<TemplateSwitcher
					ids={ settings.templateIds }
					templatePartIds={ settings.templatePartIds }
					activeId={ settings.templateId }
					isTemplatePart={ settings.templateType === 'wp_template_part' }
					onActiveIdChange={ setActiveTemplateId }
					onActiveTemplatePartIdChange={ setActiveTemplatePartId }
					onAddTemplateId={ addTemplateId }
				/>
				<BlockNavigationDropdown />
				<ToolSelector />
			</div>
			<div className="edit-site-header__actions">
				<SaveButton />
				<DropdownMenu
					icon="ellipsis"
					label={ __( 'More tools & options' ) }
					toggleProps={ {
						labelPosition: 'bottom',
					} }
					className="edit-site-header__actions-more-menu"
				>
					{ () => (
						<ThemeExporter
							ids={ settings.templateIds }
							templatePartIds={ settings.templatePartIds }
						/>
					) }
				</DropdownMenu>
			</div>
		</div>
	);
}
