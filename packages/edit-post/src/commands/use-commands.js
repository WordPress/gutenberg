/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { fullscreen } from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';

export default function useCommands() {
	const { isFullscreen } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );

		return {
			isFullscreen: get( 'core/edit-post', 'fullscreenMode' ),
		};
	}, [] );
	const { toggle } = useDispatch( preferencesStore );
	const { createInfoNotice } = useDispatch( noticesStore );

	useCommand( {
		name: 'core/toggle-fullscreen-mode',
		label: isFullscreen
			? __( 'Exit fullscreen' )
			: __( 'Enter fullscreen' ),
		icon: fullscreen,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fullscreenMode' );
			close();
			createInfoNotice(
				isFullscreen ? __( 'Fullscreen off.' ) : __( 'Fullscreen on.' ),
				{
					id: 'core/edit-post/toggle-fullscreen-mode/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								toggle( 'core/edit-post', 'fullscreenMode' );
							},
						},
					],
				}
			);
		},
	} );
}
