import clsx from 'clsx';
import { close, Icon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	getColorClassName,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as patternsStore } from '@wordpress/patterns';
import OverlayMenuIcon from './overlay-menu-icon';
import { unlock } from '../../lock-unlock';
import { getOverlayPatternName } from './use-overlay-patterns';

/**
 * The action creating (or reusing) the edited copy of a registered pattern.
 *
 * @return {Function} The `createPatternOverride` action.
 */
function useCreatePatternOverride() {
	return unlock( useDispatch( patternsStore ) ).createPatternOverride;
}

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
	overlay,
	onNavigateToEntityRecord,
} ) {
	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);
	const overlayPattern = useSelect(
		( select ) =>
			overlay && currentTheme
				? unlock( select( blockEditorStore ) ).getPatternBySlug(
						getOverlayPatternName( currentTheme, overlay )
				  )
				: null,
		[ overlay, currentTheme ]
	);
	const createPatternOverride = useCreatePatternOverride();

	if ( ! isResponsive ) {
		return children;
	}

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

	const handleToggleClick = async () => {
		// If an overlay is selected, open it for editing instead of toggling:
		// a registered pattern is edited through its copy, created on first
		// edit.
		if ( overlay && overlayPattern && onNavigateToEntityRecord ) {
			const copy = await createPatternOverride( overlayPattern );
			onNavigateToEntityRecord( {
				postId: copy.id,
				postType: 'wp_block',
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
					aria-label={ hasIcon && __( 'Open menu' ) }
					className={ openButtonClasses }
					onClick={ handleToggleClick }
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
					className="wp-block-navigation__responsive-close"
					tabIndex="-1"
				>
					<div { ...dialogProps }>
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
			</div>
		</>
	);
}
