/**
 * Internal dependencies
 */
import ModeSwitcher from './mode-switcher';
import Dashicon from '../components/dashicon';

function Header() {
	return (
		<header className="editor-header">
			<ModeSwitcher />
		</header>
	);
}

export default Header;
