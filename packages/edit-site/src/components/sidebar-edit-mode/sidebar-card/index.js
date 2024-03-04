/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

export default function SidebarCard( {
	className,
	title,
	icon,
	description,
	actions,
	children,
} ) {
	return (
		<div className={ classnames( 'edit-site-sidebar-card', className ) }>
			<Icon className="edit-site-sidebar-card__icon" icon={ icon } />
			<div className="edit-site-sidebar-card__content">
				<div className="edit-site-sidebar-card__header">
					<h2 className="edit-site-sidebar-card__title">{ title }</h2>
					{ actions }
				</div>
				<div className="edit-site-sidebar-card__description">
					{ description }
				</div>
				{ children }
			</div>
		</div>
	);
}
