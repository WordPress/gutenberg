import { __ } from '@wordpress/i18n';
import type { CircularOptionPickerPresentation } from './types';

/**
 * Resolves the effective presentation for CircularOptionPicker.
 *
 * `presentation` wins when set. Otherwise `asButtons` maps to
 * `toggle-buttons`, and the default remains `listbox`.
 */
export function resolveCircularOptionPickerPresentation(
	presentation?: CircularOptionPickerPresentation,
	asButtons?: boolean
): CircularOptionPickerPresentation {
	if ( presentation ) {
		return presentation;
	}
	return asButtons ? 'toggle-buttons' : 'listbox';
}

/**
 * Computes the common props for the CircularOptionPicker.
 */
export function getComputeCircularOptionPickerCommonProps(
	asButtons?: boolean,
	loop?: boolean,
	ariaLabel?: string,
	ariaLabelledby?: string,
	presentation?: CircularOptionPickerPresentation
) {
	const resolvedPresentation = resolveCircularOptionPickerPresentation(
		presentation,
		asButtons
	);

	const metaProps =
		resolvedPresentation === 'listbox'
			? {
					presentation: 'listbox' as const,
					asButtons: false,
					loop,
			  }
			: {
					presentation: resolvedPresentation,
					asButtons: true,
			  };

	const labelProps = {
		'aria-labelledby': ariaLabelledby,
		'aria-label': ariaLabelledby
			? undefined
			: ariaLabel || __( 'Custom color picker' ),
	};

	return { metaProps, labelProps };
}
