/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { close, Icon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { SVG, Rect } from '@wordpress/primitives';
import { __ } from '@wordpress/i18n';

export default function ResponsiveWrapper( {
	children,
	id,
	isOpen,
	isResponsive,
	onToggle,
	isHiddenByDefault,
	classNames,
	styles,
} ) {
	if ( ! isResponsive ) {
		return children;
	}
	const responsiveContainerClasses = classnames(
		'wp-block-navigation__responsive-container',
		classNames,
		{
			'is-menu-open': isOpen,
			'hidden-by-default': isHiddenByDefault,
		}
	);
	const openButtonClasses = classnames(
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

	return (
		<>
			{ ! isOpen && (
				<Button
					aria-haspopup="true"
					aria-label={ __( 'Open menu' ) }
					className={ openButtonClasses }
					onClick={ () => onToggle( true ) }
				>
					<SVG
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="24"
						height="24"
						role="img"
						aria-hidden="true"
						focusable="false"
					>
						<Rect x="4" y="7.5" width="16" height="1.5" />
						<Rect x="4" y="15" width="16" height="1.5" />
					</SVG>
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
							className="wp-block-navigation__responsive-container-close"
							aria-label={ __( 'Close menu' ) }
							onClick={ () => onToggle( false ) }
						>
							<Icon icon={ close } />
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
