/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Card, CardBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import SidebarNavigationScreenGlobalStylesContent from '../sidebar-navigation-screen-global-styles/content';
import { unlock } from '../../lock-unlock';

const { useZoomOut } = unlock( blockEditorPrivateApis );

function ScreenStyleVariations() {
	// Style Variations should only be previewed in with
	// - a "zoomed out" editor (but not when in preview mode)
	// - "Desktop" device preview
	const isPreviewMode = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings().isPreviewMode;
	}, [] );
	useZoomOut( ! isPreviewMode );

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
