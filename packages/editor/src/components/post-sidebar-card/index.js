/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

export default function PostSidebarCard( {
	className,
	title,
	icon,
	description,
	actions,
	children,
} ) {
	return (
		<div className={ classnames( 'editor-sidebar-card', className ) }>
			<Icon className="editor-sidebar-card__icon" icon={ icon } />
			<div className="editor-sidebar-card__content">
				<div className="editor-sidebar-card__header">
					<h2 className="editor-sidebar-card__title">{ title }</h2>
					{ actions }
				</div>
				<div className="editor-sidebar-card__description">
					{ description }
				</div>
				{ children }
			</div>
		</div>
	);
}
