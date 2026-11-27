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
 * Returns a React key for each option group. A group with a unique slug keeps
 * its identity when groups are reordered or removed. Groups without a slug, or
 * with a slug that another group also uses, fall back to their index.
 */
export function getOptionGroupKeys( groups: Array< { slug?: string } > ) {
	const slugCounts = new Map< string, number >();
	for ( const { slug } of groups ) {
		if ( typeof slug === 'string' ) {
			slugCounts.set( slug, ( slugCounts.get( slug ) ?? 0 ) + 1 );
		}
	}
	return groups.map( ( { slug }, index ) =>
		typeof slug === 'string' && slugCounts.get( slug ) === 1
			? `slug-${ slug }`
			: `index-${ index }`
	);
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
