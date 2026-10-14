import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function AutosaveRetry() {
	const { isAutosaving, nextAutosaveTime } = useSelect( ( select ) => {
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

type AutosaveFailureNoticeProps = {
	/**
	 * The notice message.
	 */
	message: string;
};

/**
 * Content of the autosave failure notice, with a countdown to the next
 * autosave.
 *
 * @param props         The component props.
 * @param props.message The notice message.
 */
export default function AutosaveFailureNotice( {
	message,
}: AutosaveFailureNoticeProps ) {
	return (
		<>
			{ message } <AutosaveRetry />
		</>
	);
}
