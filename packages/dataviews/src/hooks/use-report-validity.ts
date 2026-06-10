/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Triggers `reportValidity()` on all form inputs within a container element.
 * This fires the browser's `invalid` event on each input, which validated
 * controls listen to in order to display their error states.
 *
 * Used by panel and card layouts to show validation errors
 * immediately when their content becomes visible after prior interaction.
 *
 * @param ref          A ref to the container element.
 * @param shouldReport Whether to trigger reportValidity. Typically
 *                     derived from `touched` state and open/visible state.
 */
export default function useReportValidity(
	ref: React.RefObject< HTMLElement | null >,
	shouldReport: boolean
) {
	useEffect( () => {
		if ( shouldReport && ref.current ) {
			const inputs = ref.current.querySelectorAll(
				'input, textarea, select'
			);
			inputs.forEach( ( input ) => {
				( input as HTMLInputElement ).reportValidity();
			} );
		}
	}, [ shouldReport, ref ] );
}
