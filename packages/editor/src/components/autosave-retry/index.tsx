import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Fill } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '../../store';
import { AUTOSAVE_RETRY_SLOT } from '../../store/constants';

const NOTICE_ID = 'editor-autosave';

function useRetryText( nextAutosaveTime: number | null ) {
	const { hasNotice, isAutosaving } = useSelect(
		( select ) => ( {
			hasNotice: select( noticesStore )
				.getNotices()
				.some( ( notice ) => notice.id === NOTICE_ID ),
			isAutosaving: select( editorStore ).isAutosavingPost() as boolean,
		} ),
		[]
	);
	const countdownTime = hasNotice ? nextAutosaveTime : null;
	const [ now, setNow ] = useState( Date.now );

	useEffect( () => {
		if ( countdownTime === null ) {
			return;
		}
		setNow( Date.now() );
		const interval = setInterval( () => setNow( Date.now() ), 1000 );
		return () => clearInterval( interval );
	}, [ countdownTime ] );

	if ( ! hasNotice ) {
		return null;
	}

	if ( isAutosaving ) {
		return __( 'Retrying…' );
	}

	if ( countdownTime === null ) {
		return null;
	}

	const seconds = Math.max( 0, Math.ceil( ( countdownTime - now ) / 1000 ) );
	return sprintf(
		/* translators: %d: Number of seconds until the next autosave. */
		_n( 'Retrying in %d second.', 'Retrying in %d seconds.', seconds ),
		seconds
	);
}

/**
 * Adds a countdown to the next autosave to the autosave failure notice.
 *
 * @param props                  Component props.
 * @param props.nextAutosaveTime When the next autosave is due, or null.
 */
export default function AutosaveRetry( {
	nextAutosaveTime,
}: {
	nextAutosaveTime: number | null;
} ) {
	const text = useRetryText( nextAutosaveTime );
	if ( ! text ) {
		return null;
	}
	return <Fill name={ AUTOSAVE_RETRY_SLOT }>{ text }</Fill>;
}
