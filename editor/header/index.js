/**
 * Internal dependencies
 */
import ModeSwitcher from './mode-switcher';

function Header( { mode, onSwitchMode } ) {
	return (
		<header className="editor-header">
			<ModeSwitcher
				mode={ mode }
				onSwitch={ onSwitchMode } />
		</header>
	);
}

export default Header;
