/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';

const SidebarHeader = ( {
	smallSidebarTitle,
	closeSidebarShortcut,
	closeSidebar,
	children,
	className,
	closeLabel,
} ) => {
	return (
		<>
			<div className="components-panel__header plugins-sidebar-header__small">
				<span className="plugins-sidebar-header__title">
					{ smallSidebarTitle || __( '(no title)' ) }
				</span>
				<Button
					onClick={ closeSidebar }
					icon={ close }
					label={ closeLabel }
				/>
			</div>
			<div
				className={ classnames(
					'components-panel__header plugins-sidebar-header',
					className
				) }
			>
				{ children }
				<Button
					onClick={ closeSidebar }
					icon={ close }
					label={ closeLabel }
					shortcut={ closeSidebarShortcut }
				/>
			</div>
		</>
	);
};

export default SidebarHeader;
