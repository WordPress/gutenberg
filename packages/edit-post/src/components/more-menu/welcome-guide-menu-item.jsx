import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { unlock } from '../../lock-unlock';

const { MoreMenuItem } = unlock( editorPrivateApis );

export default function WelcomeGuideMenuItem() {
	const isEditingTemplate = useSelect(
		( select ) =>
			select( editorStore ).getCurrentPostType() === 'wp_template',
		[]
	);
	const { toggle } = useDispatch( preferencesStore );

	return (
		<MoreMenuItem
			onClick={ () =>
				toggle(
					'core/edit-post',
					isEditingTemplate ? 'welcomeGuideTemplate' : 'welcomeGuide'
				)
			}
		>
			{ __( 'Welcome Guide' ) }
		</MoreMenuItem>
	);
}
