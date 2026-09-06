import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import SaveErrorDetails from '../save-error-details';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

type SaveErrorNoticeContent = {
	message: string;
	detail: string | null;
};

function SaveErrorNoticeContent( {
	notice,
}: {
	notice: SaveErrorNoticeContent;
} ) {
	const { setSaveErrorNotice } = unlock( useDispatch( editorStore ) );
	const { message, detail } = notice;

	return (
		<Notice
			className="editor-save-error-notice"
			status="error"
			spokenMessage={ message }
			onRemove={ () => setSaveErrorNotice( null ) }
		>
			{ message }
			<SaveErrorDetails message={ message } detail={ detail } />
		</Notice>
	);
}

/**
 * Renders the notice for the last failed save.
 *
 * Save failures don't go through the notices store, whose content is a plain
 * string, because the failure detail needs a disclosure and a way to copy it.
 */
export default function SaveErrorNotice() {
	const notice = useSelect(
		( select ) => unlock( select( editorStore ) ).getSaveErrorNotice(),
		[]
	);

	if ( ! notice ) {
		return null;
	}

	return <SaveErrorNoticeContent notice={ notice } />;
}
