/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from './mode-switcher';

function Header() {
	return (
		<header className="editor-header">
			<ModeSwitcher />
		</header>
	);
}

export default Header;
