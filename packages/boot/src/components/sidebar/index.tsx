/**
 * WordPress dependencies
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	check,
	reset as resetIcon,
	settings,
	wordpress,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Navigation from '../navigation';
import SaveButton from '../save-button';
import { STORE_NAME, store as bootStore } from '../../store';
import CustomizeNavigation from './customize-navigation';
import { useSidebarNavigationLayout } from '../navigation/use-sidebar-navigation-layout';
import { useActiveWorkspace } from '../workspaces';
import type { MenuItem as SidebarMenuItem } from '../../store/types';

declare global {
	interface Window {
		__experimentalAdminBarInEditor?: boolean;
	}
}

function NormalSidebarFooter( { onCustomize }: { onCustomize: () => void } ) {
	const dashboardLink = useSelect(
		( select ) => select( bootStore ).getDashboardLink(),
		[]
	);
	const { activeWorkspace, setActiveWorkspace, workspaces } =
		useActiveWorkspace();

	return (
		<div className="boot-sidebar__footer-content">
			<div className="boot-sidebar__footer-navigation">
				<Button
					__next40pxDefaultSize
					className="boot-sidebar__wp-admin-button"
					href={ dashboardLink || '/' }
					icon={ wordpress }
					label={ __( 'Go to WP Admin' ) }
					variant="tertiary"
				>
					{ __( 'WP Admin' ) }
				</Button>
				<DropdownMenu
					icon={ settings }
					label={ __( 'Customize navigation' ) }
					popoverProps={ { placement: 'top-end' } }
					toggleProps={ {
						__next40pxDefaultSize: true,
						variant: 'tertiary',
					} }
				>
					{ ( { onClose } ) => (
						<>
							<MenuGroup>
								<MenuItem
									onClick={ () => {
										onCustomize();
										onClose();
									} }
								>
									{ __( 'Customize navigation' ) }
								</MenuItem>
							</MenuGroup>
							<MenuGroup label={ __( 'Workspace' ) }>
								{ workspaces.map( ( workspace ) => {
									const isSelected =
										workspace.id === activeWorkspace.id;

									return (
										<MenuItem
											key={ workspace.id }
											icon={ isSelected ? check : null }
											iconPosition="left"
											isSelected={ isSelected }
											role="menuitemradio"
											onClick={ () => {
												setActiveWorkspace(
													workspace.id
												);
												onClose();
											} }
										>
											{ workspace.label }
										</MenuItem>
									);
								} ) }
							</MenuGroup>
						</>
					) }
				</DropdownMenu>
			</div>
			<div className="boot-sidebar__save-button">
				<SaveButton />
			</div>
		</div>
	);
}

function CustomizeNavigationFooter( { onDone }: { onDone: () => void } ) {
	const menuItems = useSelect(
		( select ) =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems() as SidebarMenuItem[],
		[]
	);
	const { activeWorkspace } = useActiveWorkspace();
	const layout = useSidebarNavigationLayout( menuItems, activeWorkspace );

	return (
		<div className="boot-sidebar__footer-actions">
			<Button
				__next40pxDefaultSize
				icon={ resetIcon }
				variant="tertiary"
				onClick={ layout.reset }
			>
				{ __( 'Reset navigation' ) }
			</Button>
			<Button __next40pxDefaultSize variant="primary" onClick={ onDone }>
				{ __( 'Done' ) }
			</Button>
		</div>
	);
}

export default function Sidebar() {
	const [ isCustomizingNavigation, setIsCustomizingNavigation ] =
		useState( false );
	const hasAdminBarInEditor = window.__experimentalAdminBarInEditor;

	return (
		<div className="boot-sidebar__scrollable">
			{ hasAdminBarInEditor && <div className="boot-sidebar__top-spacer" /> }
			<div className="boot-sidebar__content">
				{ isCustomizingNavigation ? (
					<CustomizeNavigation />
				) : (
					<Navigation />
				) }
			</div>
			<div className="boot-sidebar__footer">
				{ isCustomizingNavigation ? (
					<CustomizeNavigationFooter
						onDone={ () => setIsCustomizingNavigation( false ) }
					/>
				) : (
					<NormalSidebarFooter
						onCustomize={ () => setIsCustomizingNavigation( true ) }
					/>
				) }
			</div>
		</div>
	);
}
