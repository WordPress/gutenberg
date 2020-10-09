/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
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
	const ref = useRef();

	useEffect( () => {
		if ( ref.current ) {
			ref.current.focus();
		}
	}, [ ref ] );

	const { templateId, templatePartId, templateType, activeMenu } = useSelect(
		( select ) => {
			const {
				getTemplateId,
				getTemplatePartId,
				getTemplateType,
				getNavigationPanelActiveMenu,
			} = select( 'core/edit-site' );

			return {
				templateId: getTemplateId(),
				templatePartId: getTemplatePartId(),
				templateType: getTemplateType(),
				activeMenu: getNavigationPanelActiveMenu(),
			};
		},
		[]
	);

	const {
		setTemplate,
		setTemplatePart,
		setNavigationPanelActiveMenu,
	} = useDispatch( 'core/edit-site' );

	return (
		<div className="edit-site-navigation-panel">
			<Navigation
				activeItem={
					'wp_template' === templateType
						? `${ templateType }-${ templateId }`
						: `${ templateType }-${ templatePartId }`
				}
				activeMenu={ activeMenu }
				onActivateMenu={ setNavigationPanelActiveMenu }
			>
				{ activeMenu === 'root' && (
					<NavigationBackButton
						backButtonLabel={ __( 'Dashboard' ) }
						className="edit-site-navigation-panel__back-to-dashboard"
						href="index.php"
						ref={ ref }
					/>
				) }

				<NavigationMenu title={ __( 'Theme' ) }>
					<NavigationItem
						title={ __( 'Templates' ) }
						navigateToMenu="templates"
					/>

					<NavigationItem
						title={ __( 'Template Parts' ) }
						navigateToMenu="template-parts"
					/>

					<TemplatesMenu onActivateItem={ setTemplate } />

					<TemplatePartsMenu onActivateItem={ setTemplatePart } />
				</NavigationMenu>
			</Navigation>

			<NavigationPanelPreviewSlot />
		</div>
	);
};

export default NavigationPanel;
