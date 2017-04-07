/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from './mode-switcher';
import Dashicon from '../components/dashicon';

function Header() {
	return (
		<header className="editor-header">
			<ModeSwitcher />
			<div className="editor-saved-state">
				<Dashicon icon="yes" />
				Saved
			</div>
			<div className="editor-tools">
				<button className="editor-icon-button"><Dashicon icon="undo" /></button>
				<button className="editor-icon-button"><Dashicon icon="redo" /></button>
				<button className="editor-icon-button"><Dashicon icon="plus-alt" /></button>
				<div className="editor-tools__tabs">
					<button><Dashicon icon="visibility" /> Preview</button>
					<button><Dashicon icon="admin-generic" /> Post Settings</button>
				</div>
				<button className="button button-primary button-large">Publish</button>
			</div>
		</header>
	);
}

export default Header;
