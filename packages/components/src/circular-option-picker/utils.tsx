import { __ } from '@wordpress/i18n';
import deprecated from '@wordpress/deprecated';
import type { CircularOptionPickerProps } from './types';

export function warnIfCircularOptionPickerAsButtonsIsSet(
	componentName: string,
	asButtons?: boolean
) {
	if ( asButtons === undefined ) {
		return;
	}

	deprecated( `\`asButtons\` prop in wp.components.${ componentName }`, {
		since: '7.2',
		alternative: '`presentation`',
		hint: '`asButtons={ true }` maps to `presentation="toggle-buttons"`. Explicit `presentation` takes precedence.',
	} );
}

export function resolveCircularOptionPickerPresentation(
	presentation?: CircularOptionPickerProps[ 'presentation' ],
	asButtons?: boolean
): NonNullable< CircularOptionPickerProps[ 'presentation' ] > {
	return presentation ?? ( asButtons ? 'toggle-buttons' : 'listbox' );
}

/**
 * Computes the common props for the CircularOptionPicker.
 */
export function getComputeCircularOptionPickerCommonProps(
	asButtons?: boolean,
	loop?: boolean,
	ariaLabel?: string,
	ariaLabelledby?: string,
	presentation?: CircularOptionPickerProps[ 'presentation' ]
) {
	const resolvedPresentation = resolveCircularOptionPickerPresentation(
		presentation,
		asButtons
	);
	const metaProps =
		resolvedPresentation === 'listbox'
			? { presentation: 'listbox' as const, loop }
			: { presentation: resolvedPresentation };

	const labelProps = {
		'aria-labelledby': ariaLabelledby,
		'aria-label': ariaLabelledby
			? undefined
			: ariaLabel || __( 'Custom color picker' ),
	};

	return { metaProps, labelProps, resolvedPresentation };
}
