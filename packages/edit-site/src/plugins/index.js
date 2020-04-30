/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import FullscreenModeClose from '../components/header/fullscreen-mode-close';
import __experimentalSiteEditorCloseArea from '../components/header/close-area';

registerPlugin( 'edit-site', {
	render() {
		return (
			<>
				<__experimentalSiteEditorCloseArea>
					<FullscreenModeClose />
				</__experimentalSiteEditorCloseArea>
			</>
		);
	},
} );
