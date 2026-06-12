/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { close, Icon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getColorClassName } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';

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
	overlayOpenButtonDisplay,
	icon,
	overlay,
	onNavigateToEntityRecord,
} ) {
	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);

	if ( ! isResponsive ) {
		return children;
	}

	// Derive display mode: new attribute takes precedence; fall back to legacy hasIcon.
	const displayMode =
		overlayOpenButtonDisplay ?? ( hasIcon !== false ? 'icon' : 'text' );
	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	// Only apply overlay colors if there's no custom overlay template part.
	const hasCustomOverlay = !! overlay;

	const responsiveContainerClasses = clsx(
		'wp-block-navigation__responsive-container',
		! hasCustomOverlay && {
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
		},
		{
			'is-menu-open': isOpen,
			'hidden-by-default': isHiddenByDefault,
		}
	);

	const styles = ! hasCustomOverlay
		? {
				color: ! overlayTextColor?.slug && overlayTextColor?.color,
				backgroundColor:
					! overlayBackgroundColor?.slug &&
					overlayBackgroundColor?.color &&
					overlayBackgroundColor.color,
		  }
		: {};

	const openButtonClasses = clsx(
		'wp-block-navigation__responsive-container-open',
		{ 'always-shown': isHiddenByDefault }
	);

	const modalId = `${ id }-modal`;

	const dialogProps = {
		className: 'wp-block-navigation__responsive-dialog',
		...( isOpen && {
			role: 'dialog',
			'aria-modal': true,
			'aria-label': __( 'Menu' ),
		} ),
	};

	const handleToggleClick = () => {
		// If an overlay template part is selected, navigate to it instead of toggling
		if ( overlay && onNavigateToEntityRecord ) {
			const templatePartId = createTemplatePartId(
				currentTheme,
				overlay
			);

			onNavigateToEntityRecord( {
				postId: templatePartId,
				postType: 'wp_template_part',
			} );
			return;
		}
		// Otherwise, use normal toggle behavior
		onToggle( true );
	};

	return (
		<>
			{ ! isOpen && (
				<Button
					__next40pxDefaultSize
					aria-haspopup="true"
					aria-label={
						showIcon && ! showText ? __( 'Open menu' ) : undefined
					}
					className={ openButtonClasses }
					onClick={ handleToggleClick }
				>
					{ showIcon && <OverlayMenuIcon icon={ icon } /> }
					{ showText && __( 'Menu' ) }
				</Button>
			) }

			<div
				className={ responsiveContainerClasses }
				style={ styles }
				id={ modalId }
			>
				<div
					className="wp-block-navigation__responsive-close"
					tabIndex="-1"
				>
					<div { ...dialogProps }>
						<Button
							__next40pxDefaultSize
							className="wp-block-navigation__responsive-container-close"
							aria-label={
								showIcon && ! showText
									? __( 'Close menu' )
									: undefined
							}
							onClick={ () => onToggle( false ) }
						>
							{ showIcon && <Icon icon={ close } /> }
							{ showText && __( 'Close' ) }
						</Button>
						<div
							className="wp-block-navigation__responsive-container-content"
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
