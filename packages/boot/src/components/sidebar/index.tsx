/**
 * Internal dependencies
 */
import SiteHub from '../site-hub';
import Navigation from '../navigation';
import SaveButton from '../save-button';
import './style.scss';

export default function Sidebar() {
	return (
		<div className="boot-sidebar__scrollable">
			<SiteHub />
			<div className="boot-sidebar__content">
				<Navigation />
			</div>
			<div className="boot-sidebar__footer">
				<SaveButton />
			</div>
		</div>
	);
}
