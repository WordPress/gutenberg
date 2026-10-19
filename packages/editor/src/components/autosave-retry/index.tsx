import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	store as noticesStore,
	privateApis as noticesPrivateApis,
} from '@wordpress/notices';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { createNoticeContentFill } = unlock( noticesPrivateApis );

const NOTICE_ID = 'editor-autosave';
const AutosaveFailureContent = createNoticeContentFill( NOTICE_ID );

function useRetryText() {
	const { isAutosaving, nextAutosaveTime } = useSelect( ( select ) => {
		const hasNotice = select( noticesStore )
			.getNotices()
			.some( ( notice ) => notice.id === NOTICE_ID );
		if ( ! hasNotice ) {
			return { isAutosaving: false, nextAutosaveTime: null };
		}
		const { isAutosavingPost, getNextAutosaveTime } = unlock(
			select( editorStore )
		);
		return {
			isAutosaving: isAutosavingPost() as boolean,
			nextAutosaveTime: getNextAutosaveTime() as number | null,
		};
	}, [] );
	const [ now, setNow ] = useState( Date.now );

	useEffect( () => {
		if ( nextAutosaveTime === null ) {
			return;
		}
		setNow( Date.now() );
		const interval = setInterval( () => setNow( Date.now() ), 1000 );
		return () => clearInterval( interval );
	}, [ nextAutosaveTime ] );

	if ( isAutosaving ) {
		return __( 'Retrying…' );
	}

	if ( nextAutosaveTime === null ) {
		return null;
	}

	const seconds = Math.max(
		0,
		Math.ceil( ( nextAutosaveTime - now ) / 1000 )
	);
	return sprintf(
		/* translators: %d: Number of seconds until the next autosave. */
		_n( 'Retrying in %d second.', 'Retrying in %d seconds.', seconds ),
		seconds
	);
}

/**
 * Adds a countdown to the next autosave to the autosave failure notice.
 */
export default function AutosaveRetry() {
	const text = useRetryText();
	if ( ! text ) {
		return null;
	}
	return <AutosaveFailureContent> { text }</AutosaveFailureContent>;
}
