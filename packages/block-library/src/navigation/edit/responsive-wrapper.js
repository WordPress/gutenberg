/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { close, Icon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useRefEffect } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';
import { getScrollContainer } from '@wordpress/dom';

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
	// Depending on the isOpen state, adds/removes a class on document root to
	// match front end. Also if the document root is not the scrolling context,
	// as is the case if the editor is not iframed, disables/enables scrolling.
	// Since “Device previews” force the iframe this should only be applicable
	// when editing in a narrow viewport or if the Navigation is set to always
	// be overlaid.
	const effectRootAndScrollContainer = useRefEffect(
		( node ) => {
			const shouldShow = isResponsive && isOpen;
			const root = node.ownerDocument.documentElement;
			root.classList.toggle( 'has-modal-open', shouldShow );
			if ( shouldShow ) {
				const isNonIframed = node.ownerDocument.defaultView === window;
				// The dialog is not modal unless the canvas is iframed because
				// as a modal it can’t be contained by the canvas.
				node[ isNonIframed ? 'show' : 'showModal' ]();
				const scrollContainer = getScrollContainer( node );
				if ( root === scrollContainer ) {
					return;
				}
				// There is some potential that the scroll container is not the
				// root even when the editor is iframed but this should be okay.
				// Note the front end doesn’t have equivalent logic, so there
				// could be a discrepancy for such cases.
				const overflowBackup = [
					scrollContainer.style.getPropertyValue( 'overflow' ),
					scrollContainer.style.getPropertyPriority( 'overflow' ),
				];
				scrollContainer.style.setProperty(
					'overflow',
					'hidden',
					'important'
				);
				return () => {
					scrollContainer.style.setProperty(
						'overflow',
						...overflowBackup
					);
				};
			}
			node.close();
		},
		[ isOpen, isResponsive ]
	);
	if ( ! isResponsive ) {
		return children;
	}

	const responsiveContainerClasses = clsx(
		'wp-block-navigation__responsive-container',
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

	const openButtonClasses = clsx(
		'wp-block-navigation__responsive-container-open',
		{ 'always-shown': isHiddenByDefault }
	);

	const modalId = `${ id }-modal`;

	return (
		<>
			{ ! isOpen && (
				<Button
					__next40pxDefaultSize
					aria-haspopup="true"
					aria-label={ hasIcon && __( 'Open menu' ) }
					className={ openButtonClasses }
					onClick={ () => onToggle( true ) }
				>
					{ hasIcon && <OverlayMenuIcon icon={ icon } /> }
					{ ! hasIcon && __( 'Menu' ) }
				</Button>
			) }

			<dialog
				className={ responsiveContainerClasses }
				style={ styles }
				id={ modalId }
				ref={ effectRootAndScrollContainer }
				aria-label={ isOpen && __( 'Menu' ) }
			>
				<div
					className="wp-block-navigation__responsive-close"
					tabIndex="-1"
				>
					<div className="wp-block-navigation__responsive-dialog">
						<Button
							__next40pxDefaultSize
							className="wp-block-navigation__responsive-container-close"
							aria-label={ hasIcon && __( 'Close menu' ) }
							onClick={ () => onToggle( false ) }
						>
							{ hasIcon && <Icon icon={ close } /> }
							{ ! hasIcon && __( 'Close' ) }
						</Button>
						<div
							className="wp-block-navigation__responsive-container-content"
							id={ `${ modalId }-content` }
						>
							{ children }
						</div>
					</div>
				</div>
			</dialog>
		</>
	);
}
