/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { pencil as editIcon } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import PostTypeSupportCheck from '../post-type-support-check';
import {
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
} from '../post-revisions-preview/diff-format-types';
import { clearSuggestionCaches } from '../suggestion-mode-diff';

const SuggestionModeToggle = () => {
	const { isSuggestionModeActive, showIconLabels } = useSelect(
		( select ) => ( {
			isSuggestionModeActive: unlock(
				select( editorStore )
			).isSuggestionMode(),
			showIconLabels: select( preferencesStore ).get(
				'core',
				'showIconLabels'
			),
		} )
	);

	const { setSuggestionMode } = unlock( useDispatch( editorStore ) );

	const handleToggle = () => {
		const enabling = ! isSuggestionModeActive;
		if ( enabling ) {
			// Register format types before dispatching so they exist
			// when BlockEdit renders with diffed attributes.
			registerDiffFormatTypes();
			setSuggestionMode( true );
		} else {
			setSuggestionMode( false );
			clearSuggestionCaches();
			// Defer unregister so blocks re-render without diff
			// attributes before the format types are removed.
			setTimeout( () => unregisterDiffFormatTypes(), 0 );
		}
	};

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<Button
				onClick={ handleToggle }
				icon={ editIcon }
				label={ __( 'Suggestion Mode' ) }
				isPressed={ isSuggestionModeActive }
				size="compact"
				showTooltip={ ! showIconLabels }
				className="editor-suggestion-mode-toggle"
			/>
		</PostTypeSupportCheck>
	);
};

export default SuggestionModeToggle;
