/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * A hook that reports custom validity on form elements within a container.
 * When `shouldReport` is true, it triggers the browser's native validation UI
 * by calling `reportValidity()` on the container's form elements.
 *
 * @param ref          - A ref to the container element
 * @param shouldReport - Whether to report validity
 */
export default function useReportValidity(
	ref: React.RefObject< HTMLElement | null >,
	shouldReport: boolean
): void {
	useEffect( () => {
		if ( ! shouldReport || ! ref.current ) {
			return;
		}

		// Find the first invalid form element and report its validity
		const formElements = ref.current.querySelectorAll(
			'input, select, textarea'
		);

		for ( const element of formElements ) {
			if (
				element instanceof HTMLInputElement ||
				element instanceof HTMLSelectElement ||
				element instanceof HTMLTextAreaElement
			) {
				if ( ! element.validity.valid ) {
					element.reportValidity();
					break;
				}
			}
		}
	}, [ ref, shouldReport ] );
}
