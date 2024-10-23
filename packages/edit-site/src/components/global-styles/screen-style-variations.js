/**
 * WordPress dependencies
 */
import { Card, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import SidebarNavigationScreenGlobalStylesContent from '../sidebar-navigation-screen-global-styles/content';
import { unlock } from '../../lock-unlock';

const { useZoomOut } = unlock( blockEditorPrivateApis );

function ScreenStyleVariations() {
	// Style Variations should only be previewed in with
	// - a "zoomed out" editor
	// - "Desktop" device preview
	const { setDeviceType } = useDispatch( editorStore );
	useZoomOut();
	setDeviceType( 'desktop' );

	return (
		<>
			<ScreenHeader
				title={ __( 'Browse styles' ) }
				description={ __(
					'Choose a variation to change the look of the site.'
				) }
			/>

			<Card
				size="small"
				isBorderless
				className="edit-site-global-styles-screen-style-variations"
			>
				<CardBody>
					<SidebarNavigationScreenGlobalStylesContent />
				</CardBody>
			</Card>
		</>
	);
}

export default ScreenStyleVariations;
