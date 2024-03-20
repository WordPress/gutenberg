/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalText as Text,
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
			<HStack
				spacing={ 2 }
				className="edit-site-sidebar-card__header"
				align="flex-start"
			>
				<Icon className="edit-site-sidebar-card__icon" icon={ icon } />
				<Text
					numberOfLines={ 2 }
					truncate
					className="edit-site-sidebar-card__title"
					weight={ 500 }
					as="h2"
				>
					{ title }
				</Text>
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
