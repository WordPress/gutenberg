import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { unlock } from '../../lock-unlock';

const { MoreMenuItem } = unlock( editorPrivateApis );

export default function WelcomeGuideMenuItem() {
	const { toggle } = useDispatch( preferencesStore );

	return (
		<MoreMenuItem
			onClick={ () => toggle( 'core/edit-site', 'welcomeGuide' ) }
		>
			{ __( 'Welcome Guide' ) }
		</MoreMenuItem>
	);
}
