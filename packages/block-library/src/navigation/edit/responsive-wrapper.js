/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';
import useNavigationEntities from '../use-navigation-entities';

export default function ResponsiveWrapper( {
	children,
	currentMenuId,
	isOpen,
	isResponsive,
	isHiddenByDefault,
	hasIcon,
	icon,
} ) {
	const { theme } = useNavigationEntities();
	const menuSlug = 'navigation-overlay-' + currentMenuId;
	const activeTheme = theme[ 0 ].stylesheet;
	const templatePartId = activeTheme + '//' + menuSlug;
	// Find a template part that matches the menu.
	const { hasTemplatePart } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const part = getEntityRecord(
			'postType',
			'wp_template_part',
			templatePartId
		);
		return {
			hasTemplatePart: part ? true : false,
		};
	}, [] );

	if ( ! isResponsive ) {
		return children;
	}

	const responsiveContainerClasses = classnames(
		'wp-block-navigation__responsive-container',
		{
			'hidden-by-default': isHiddenByDefault,
		}
	);

	const openButtonClasses = classnames(
		'wp-block-navigation__responsive-container-open',
		{ 'always-shown': isHiddenByDefault }
	);

	return (
		<>
			{ ! isOpen && (
				<Button
					aria-label={ __( 'Edit Overlay' ) }
					className={ openButtonClasses }
					/**
					 * To do:
					 * Clicking this tries to reload the site editor inside the site editor.
					 */
					href={
						hasTemplatePart
							? addQueryArgs( 'site-editor.php', {
									postType: 'wp_template_part',
									postId: templatePartId,
									canvas: 'edit',
							  } )
							: null
					}
				>
					{ hasIcon && <OverlayMenuIcon icon={ icon } /> }
					{ ! hasIcon && __( 'Menu' ) }
				</Button>
			) }
			<div className={ responsiveContainerClasses }>
				<div className="wp-block-navigation__responsive-container-content">
					{ children }
				</div>
			</div>
		</>
	);
}
