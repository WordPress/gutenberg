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

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';

export default function ResponsiveWrapper( {
	children,
	isOpen,
	isResponsive,
	isHiddenByDefault,
	hasIcon,
	icon,
	overlayTemplatePart,
} ) {
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
					href={ addQueryArgs( 'site-editor.php', {
						postType: 'wp_template_part',
						postId: overlayTemplatePart,
						canvas: 'edit',
					} ) }
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
