/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Shows validation errors for all invalid form inputs within a container
 * element, without moving focus. It fires a synthetic `invalid` event on each
 * invalid input, which validated controls listen to in order to display their
 * error states. Unlike `reportValidity()`, it never focuses the invalid
 * input, so the natural tab sequence is preserved.
 *
 * Used by panel and card layouts to show validation errors
 * immediately when their content becomes visible after prior interaction.
 *
 * @param ref          A ref to the container element.
 * @param shouldReport Whether to trigger the invalid events when it becomes
 *                     `true`. Typically derived from `touched` state and
 *                     open/visible state.
 *
 * @return A callback that reveals the errors on demand, for layouts that also
 *         need to report on a recurring event such as losing focus.
 */
export default function useReportValidity(
	ref: React.RefObject< HTMLElement | null >,
	shouldReport: boolean
) {
	const reportValidity = useCallback( () => {
		const inputs = ref.current?.querySelectorAll<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>( 'input, textarea, select' );
		inputs?.forEach( ( input ) => {
			if ( input.willValidate && ! input.validity.valid ) {
				input.dispatchEvent(
					new Event( 'invalid', { cancelable: true } )
				);
			}
		} );
	}, [ ref ] );

	useEffect( () => {
		if ( shouldReport ) {
			reportValidity();
		}
	}, [ shouldReport, reportValidity ] );

	return reportValidity;
}
