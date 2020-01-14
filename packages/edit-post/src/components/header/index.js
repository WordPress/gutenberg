/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import HeaderToolbar from './header-toolbar';

function Header() {
	return (
		<div className="edit-post-header">
			<div className="edit-post-header__toolbar">
				<FullscreenModeClose />
				<HeaderToolbar />
			</div>
		</div>
	);
}

export default Header;
