/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
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

const NavigationPanel = () => {
	const [ activeMenu, setActiveMenu ] = useState( 'root' );
	const ref = useRef();

	useEffect( () => {
		ref.current.focus();
	}, [ ref ] );

	const { template, templatePartId, templateType } = useSelect(
		( select ) => {
			const {
				getTemplateId,
				getTemplatePartId,
				getTemplateType,
			} = select( 'core/edit-site' );

			return {
				template: select( 'core' ).getEntityRecord(
					'postType',
					'wp_template',
					getTemplateId()
				),
				templatePartId: getTemplatePartId(),
				templateType: getTemplateType(),
			};
		},
		[]
	);

	const { setTemplate, setTemplatePart } = useDispatch( 'core/edit-site' );

	return (
		<div className="edit-site-navigation-panel">
			<Navigation
				activeItem={
					'wp_template' === templateType
						? `template-${ template?.slug }`
						: `template-part-${ templatePartId }`
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
		</div>
	);
};

export default NavigationPanel;
