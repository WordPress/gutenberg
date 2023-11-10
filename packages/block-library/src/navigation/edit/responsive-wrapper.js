/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { close, Icon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';

export default function ResponsiveWrapper( {
	children,
	id,
	isOpen,
	isResponsive,
	onToggle,
	isHiddenByDefault,
	overlayBackgroundColor,
	overlayTextColor,
	hasIcon,
	icon,
} ) {
	if ( ! isResponsive ) {
		return children;
	}

	const responsiveContainerClasses = classnames(
		'wp-block-navigation__responsive-container',
		'wp-overlay-component',
		{
			'has-text-color':
				!! overlayTextColor.color || !! overlayTextColor?.class,
			[ getColorClassName( 'color', overlayTextColor?.slug ) ]:
				!! overlayTextColor?.slug,
			'has-background':
				!! overlayBackgroundColor.color ||
				overlayBackgroundColor?.class,
			[ getColorClassName(
				'background-color',
				overlayBackgroundColor?.slug
			) ]: !! overlayBackgroundColor?.slug,
			'is-menu-open': isOpen,
			'is-overlay-open': isOpen, // alias for new overlay specific style
			'hidden-by-default': isHiddenByDefault,
		}
	);

	const styles = {
		color: ! overlayTextColor?.slug && overlayTextColor?.color,
		backgroundColor:
			! overlayBackgroundColor?.slug &&
			overlayBackgroundColor?.color &&
			overlayBackgroundColor.color,
	};

	const openButtonClasses = classnames(
		'wp-block-navigation__responsive-container-open',
		'wp-overlay-component__open',
		'wp-overlay-component__toggle',
		{ 'always-shown': isHiddenByDefault }
	);

	const modalId = `${ id }-modal`;

	const dialogProps = {
		className:
			'wp-block-navigation__responsive-dialog wp-overlay-component__dialog',
		...( isOpen && {
			role: 'dialog',
			'aria-modal': true,
			'aria-label': __( 'Menu' ),
		} ),
	};

	return (
		<>
			{ ! isOpen && (
				<Button
					aria-haspopup="true"
					aria-label={ hasIcon && __( 'Open menu' ) }
					className={ openButtonClasses }
					onClick={ () => onToggle( true ) }
				>
					{ hasIcon && <OverlayMenuIcon icon={ icon } /> }
					{ ! hasIcon && __( 'Menu' ) }
				</Button>
			) }

			<div
				className={ responsiveContainerClasses }
				style={ styles }
				id={ modalId }
			>
				<div
					className="wp-block-navigation__responsive-close wp-overlay-component__maybe-redundant"
					tabIndex="-1"
				>
					<div { ...dialogProps }>
						<Button
							className="wp-block-navigation__responsive-container-close wp-overlay-component__close wp-overlay-component__toggle"
							aria-label={ hasIcon && __( 'Close menu' ) }
							onClick={ () => onToggle( false ) }
						>
							{ hasIcon && <Icon icon={ close } /> }
							{ ! hasIcon && __( 'Close' ) }
						</Button>
						<div
							className="wp-block-navigation__responsive-container-content wp-overlay-component__content"
							id={ `${ modalId }-content` }
						>
							{ children }
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
