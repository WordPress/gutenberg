/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationBackButton as NavigationBackButton,
	createSlotFill,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplatesMenu from './menus/templates';
import TemplatePartsMenu from './menus/template-parts';

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

const NavigationPanel = () => {
	const [ activeMenu, setActiveMenu ] = useState( 'root' );
	const ref = useRef();

	useEffect( () => {
		ref.current.focus();
	}, [ ref ] );

	const { template, templatePart, templateType } = useSelect( ( select ) => {
		const { getEntityRecord } = select( 'core' );
		const { getTemplateId, getTemplatePartId, getTemplateType } = select(
			'core/edit-site'
		);

		const templateId = getTemplateId();
		const templatePartId = getTemplatePartId();

		// We need to retrieve full entity records to know the slug of templates.
		// Slugs are essential to determine the `activeItem` since theme template files' ID defaults to slug.
		// Which means when we auto-draft a theme template file then it receives an auto-increment ID.
		// We use slug because that's always the same. If we would use ID
		// then we would have a brief moment without an activeItem (when theme template files is replaced by the auto-draft).
		return {
			template: templateId
				? getEntityRecord( 'postType', 'wp_template', templateId )
				: null,
			templatePart: templatePartId
				? getEntityRecord(
						'postType',
						'wp_template_part',
						templatePartId
				  )
				: null,
			templateType: getTemplateType(),
		};
	}, [] );

	const { setTemplate, setTemplatePart } = useDispatch( 'core/edit-site' );

	return (
		<div className="edit-site-navigation-panel">
			<Navigation
				activeItem={
					'wp_template' === templateType
						? `template-${ template?.slug }`
						: `template-part-${ templatePart?.slug }`
				}
				onActivateMenu={ setActiveMenu }
			>
				{ activeMenu === 'root' && (
					<NavigationBackButton
						backButtonLabel={ __( 'Dashboard' ) }
						className="edit-site-navigation-panel__back-to-dashboard"
						href="index.php"
						ref={ ref }
					/>
				) }

				<NavigationMenu title="Theme">
					<NavigationItem
						title="Templates"
						navigateToMenu="templates"
					/>

					<NavigationItem
						title="Template parts"
						navigateToMenu="template-parts"
					/>

					<TemplatesMenu onActiveIdChange={ setTemplate } />

					<TemplatePartsMenu
						onActiveTemplatePartIdChange={ setTemplatePart }
					/>
				</NavigationMenu>
			</Navigation>

			<NavigationPanelPreviewSlot />
		</div>
	);
};

export default NavigationPanel;
