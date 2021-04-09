/**
 * External dependencies
 */
import classnames from 'classnames';
import micromodal from 'micromodal';

/**
 * WordPress dependencies
 */
import { close, Icon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { SVG, Rect } from '@wordpress/primitives';

export default function ResponsiveWrapper( props ) {
	useEffect( () => {
		if ( true === props.isResponsive ) {
			micromodal.init( {
				openClass: 'is-menu-open',
			} );
		}
	}, [ props.isResponsive ] );

	if ( ! props.isResponsive ) {
		return props.children;
	}
	const responsiveContainerClasses = classnames(
		'wp-block-navigation__responsive-container',
		{
			'is-menu-open': props.isOpen,
		}
	);

	const modalId = `${ props.clientId }-modal`;

	return (
		<>
			<Button
				className="wp-block-navigation__responsive-container-open "
				aria-label="Close menu"
				data-micromodal-trigger={ modalId }
				onClick={ () => props.onToggle( true ) }
			>
				<SVG
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					role="img"
					ariaHidden="true"
					focusable="false"
				>
					<Rect x="4" y="7.5" width="16" height="1.5" />
					<Rect x="4" y="15" width="16" height="1.5" />
				</SVG>
			</Button>

			<div
				className={ responsiveContainerClasses }
				id={ modalId }
				aria-hidden="true"
			>
				<div
					className="wp-block-navigation__responsive-close"
					tabIndex="-1"
					data-micromodal-close
				>
					<div
						className="wp-block-navigation__responsive-dialog"
						role="dialog"
						aria-modal="true"
						aria-labelledby={ `${ modalId }-title` }
					>
						<Button
							className="wp-block-navigation__responsive-container-close"
							aria-label="Close menu"
							data-micromodal-close
							onClick={ () => props.onToggle( false ) }
						>
							<Icon icon={ close } />
						</Button>
						<div
							className="wp-block-navigation__responsive-container-content"
							id={ `${ props.clientId }-modal-content` }
						>
							{ props.children }
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
