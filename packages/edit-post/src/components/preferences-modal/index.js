/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { PreferencesModal, PreferencesModalTabs } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import GeneralPreferences from './general-preferences';
import BlockPreferences from './block-preferences';
import PanelPreferences from './panel-preferences';

const MODAL_NAME = 'edit-post/preferences';

export default function PostEditorPreferencesModal() {
	const { closeModal } = useDispatch( editPostStore );
	const isModalActive = useSelect(
		( select ) => select( editPostStore ).isModalActive( MODAL_NAME ),
		[]
	);

	const tabs = useMemo(
		() => [
			{
				name: 'general',
				title: __( 'General' ),
				content: <GeneralPreferences />,
			},
			{
				name: 'blocks',
				title: __( 'Blocks' ),
				content: <BlockPreferences />,
			},
			{
				name: 'panels',
				title: __( 'Panels' ),
				content: <PanelPreferences />,
			},
		],
		[]
	);

	if ( ! isModalActive ) {
		return null;
	}

	return (
		<PreferencesModal onRequestClose={ closeModal }>
			<PreferencesModalTabs tabs={ tabs } />
		</PreferencesModal>
	);
}
