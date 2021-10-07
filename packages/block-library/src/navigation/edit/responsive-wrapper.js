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
} ) {
	if ( ! isResponsive ) {
		return children;
	}
	const responsiveContainerClasses = classnames(
		'wp-block-navigation__responsive-container',
		{
			'is-menu-open': isOpen,
		}
	);

	const modalId = `${ id }-modal`;

	return (
		<>
			{ ! isOpen && (
				<Button
					aria-haspopup="true"
					aria-expanded={ isOpen }
					aria-label={ __( 'Open menu' ) }
					className="wp-block-navigation__responsive-container-open"
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
				id={ modalId }
				aria-hidden={ ! isOpen }
			>
				<div
					className="wp-block-navigation__responsive-close"
					tabIndex="-1"
				>
					<div
						className="wp-block-navigation__responsive-dialog"
						role="dialog"
						aria-modal="true"
						aria-labelledby={ `${ modalId }-title` }
					>
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
