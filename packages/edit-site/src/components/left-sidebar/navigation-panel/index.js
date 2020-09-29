/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationBackButton as NavigationBackButton,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateSwitcher from './template-switcher';

const NavigationPanel = () => {
	const ref = useRef();

	useEffect( () => {
		ref.current.focus();
	}, [ ref ] );

	const { templateId, templatePartId, templateType, page } = useSelect(
		( select ) => {
			const {
				getTemplateId,
				getTemplatePartId,
				getTemplateType,
				getPage,
			} = select( 'core/edit-site' );

			return {
				templateId: getTemplateId(),
				templatePartId: getTemplatePartId(),
				templateType: getTemplateType(),
				page: getPage(),
			};
		},
		[]
	);

	const {
		setTemplate,
		addTemplate,
		removeTemplate,
		setTemplatePart,
	} = useDispatch( 'core/edit-site' );

	return (
		<div className="edit-site-navigation-panel">
			<Navigation
				activeItem={
					'wp_template' === templateType
						? `template-${ templateId }`
						: `template-part-${ templatePartId }`
				}
			>
				<NavigationBackButton
					backButtonLabel={ __( 'Dashboard' ) }
					className="edit-site-navigation-panel__back-to-dashboard"
					href="index.php"
					ref={ ref }
				/>

				<NavigationMenu title="Home">
					<TemplateSwitcher
						page={ page }
						activeId={ templateId }
						onActiveIdChange={ setTemplate }
						onActiveTemplatePartIdChange={ setTemplatePart }
						onAddTemplate={ addTemplate }
						onRemoveTemplate={ removeTemplate }
					/>
				</NavigationMenu>
			</Navigation>
		</div>
	);
};

export default NavigationPanel;
