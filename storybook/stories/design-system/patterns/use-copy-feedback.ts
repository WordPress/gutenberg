import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';

const FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

export const RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

/**
 * Copies text and shows the result on the trigger.
 *
 * The returned `result` selects the idle, success, or error icon. Each
 * result bumps an id so a repeat of the same outcome restarts the time the
 * icon stays visible. `speak()` announces the outcome. The trigger's label
 * stays unchanged.
 */
export function useCopyFeedback( text: string | ( () => string ) ) {
	const [ feedback, setFeedback ] = useState< {
		result: CopyResult;
		id: number;
	} >( { result: 'idle', id: 0 } );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setFeedback( { result: 'idle', id: 0 } ),
			FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	function report( result: Exclude< CopyResult, 'idle' >, message: string ) {
		setFeedback( ( current ) => ( {
			result,
			id: current.id + 1,
		} ) );
		speak( message );
	}

	const ref = useCopyToClipboard(
		text,
		() => report( 'copied', 'Copied to clipboard' ),
		() => report( 'error', "Couldn't copy to clipboard." )
	);

	return { result: feedback.result, ref };
}
