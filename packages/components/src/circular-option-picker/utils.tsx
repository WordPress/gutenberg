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
 * Returns a React key for each option group. A group with a slug keeps its
 * identity when groups are reordered or removed. Repeated slugs get an
 * occurrence suffix, and groups without a slug fall back to their index.
 */
export function getOptionGroupKeys( groups: Array< { slug?: string } > ) {
	const occurrences = new Map< string, number >();
	return groups.map( ( { slug }, index ) => {
		if ( typeof slug !== 'string' ) {
			return `index-${ index }`;
		}
		const occurrence = occurrences.get( slug ) ?? 0;
		occurrences.set( slug, occurrence + 1 );
		return `slug-${ slug }-${ occurrence }`;
	} );
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
