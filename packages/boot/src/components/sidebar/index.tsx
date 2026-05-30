/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SiteHub from '../site-hub';
import Navigation from '../navigation';
import SaveButton from '../save-button';
import { store as bootStore } from '../../store';
import './style.scss';

declare global {
	interface Window {
		__experimentalAdminBarInEditor?: boolean;
	}
}

function DashboardBackButton() {
	const dashboardLink = useSelect(
		( select ) => select( bootStore ).getDashboardLink(),
		[]
	);
	return (
		<Button
			__next40pxDefaultSize
			className="boot-sidebar__back-button"
			href={ dashboardLink || '/' }
			icon={ isRTL() ? chevronRight : chevronLeft }
			label={ __( 'Go to the Dashboard' ) }
		>
			{ __( 'Dashboard' ) }
		</Button>
	);
}

export default function Sidebar() {
	const hasAdminBarInEditor = window.__experimentalAdminBarInEditor;
	return (
		<div className="boot-sidebar__scrollable">
			{ hasAdminBarInEditor ? <DashboardBackButton /> : <SiteHub /> }
			<div className="boot-sidebar__content">
				<Navigation />
			</div>
			<div className="boot-sidebar__footer">
				<SaveButton />
			</div>
		</div>
	);
}
