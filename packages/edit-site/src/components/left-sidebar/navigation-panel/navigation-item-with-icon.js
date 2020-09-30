/**
 * WordPress dependencies
 */
import {
	Button,
	Tooltip,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';

export default function NavigationItemWithIcon( {
	item,
	icon,
	iconLabel,
	title,
	...props
} ) {
	return (
		<NavigationItem
			item={ item }
			title={ title }
			className="edit-site-template-switcher__navigation-item"
		>
			<Button { ...props }>
				{ title }
				{ icon && (
					<Tooltip text={ iconLabel || title }>
						<div className="edit-site-template-switcher__navigation-item-icon">
							<Icon icon={ icon } />
						</div>
					</Tooltip>
				) }
			</Button>
		</NavigationItem>
	);
}
