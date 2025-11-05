/**
 * Internal dependencies
 */
import SiteHub from '../site-hub';
import Navigation from '../navigation';
import './style.scss';

export default function Sidebar() {
	return (
		<div className="boot-sidebar__scrollable">
			<SiteHub />
			<div className="boot-sidebar__content">
				<Navigation />
			</div>
		</div>
	);
}
