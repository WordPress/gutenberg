/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationBackButton as NavigationBackButton,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplatesMenu from './menus/templates';
import TemplatePartsMenu from './menus/template-parts';
import { MENU_ROOT, MENU_TEMPLATE_PARTS, MENU_TEMPLATES } from './constants';

export default function TemplatesNavigation() {
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
		<Navigation
			activeItem={
				'wp_template' === templateType
					? `${ templateType }-${ templateId }`
					: `${ templateType }-${ templatePartId }`
			}
			activeMenu={ activeMenu }
			onActivateMenu={ setNavigationPanelActiveMenu }
		>
			{ activeMenu === MENU_ROOT && (
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
					navigateToMenu={ MENU_TEMPLATES }
				/>

				<NavigationItem
					title={ __( 'Template Parts' ) }
					navigateToMenu={ MENU_TEMPLATE_PARTS }
				/>

				<TemplatesMenu onActivateItem={ setTemplate } />

				<TemplatePartsMenu onActivateItem={ setTemplatePart } />
			</NavigationMenu>
		</Navigation>
	);
}
