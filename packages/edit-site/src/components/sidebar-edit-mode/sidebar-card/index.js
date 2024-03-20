/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

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
			<HStack spacing={ 3 } className="edit-site-sidebar-card__header">
				<Icon className="edit-site-sidebar-card__icon" icon={ icon } />
				<h2 className="edit-site-sidebar-card__title">{ title }</h2>
				{ actions }
			</HStack>
			<VStack className="edit-site-sidebar-card__content">
				{ description && (
					<div className="edit-site-sidebar-card__description">
						{ description }
					</div>
				) }
				{ children }
			</VStack>
		</div>
	);
}
