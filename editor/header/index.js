/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from './mode-switcher';
import SavedState from './saved-state';
import Tools from './tools';

function Header() {
	return (
		<header className="editor-header">
			<ModeSwitcher />
			<SavedState />
			<Tools />
		</header>
	);
}

export default Header;
