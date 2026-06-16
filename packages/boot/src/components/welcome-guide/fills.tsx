/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import WelcomeGuide from '.';
import WelcomeGuideMenuItem from './menu-item';

const { PreferencesModal, ToolsMoreMenuGroup } = unlock( editorPrivateApis );

export default function WelcomeGuideFills( {
	postType,
}: {
	postType?: string;
} ) {
	const { setDefaults } = useDispatch( preferencesStore );

	useEffect( () => {
		setDefaults( 'core/edit-site', {
			welcomeGuide: true,
			welcomeGuideStyles: true,
			welcomeGuidePage: true,
			welcomeGuideTemplate: true,
		} );
	}, [ setDefaults ] );

	return (
		<>
			<ToolsMoreMenuGroup>
				<WelcomeGuideMenuItem />
			</ToolsMoreMenuGroup>
			<PreferencesModal />
			<WelcomeGuide postType={ postType } />
		</>
	);
}
