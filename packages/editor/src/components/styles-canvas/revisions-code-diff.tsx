import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	areGlobalStylesEqual,
	type GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import {
	SplitCodeDiffTable,
	getSplitCodeDiffRows,
} from '../post-revisions-preview/revisions-code-diff';

type StylesConfig = Pick< GlobalStylesConfig, 'settings' | 'styles' >;

/**
 * Returns the value with the keys of every nested object sorted, so that two
 * configs with the same content serialize the same. Arrays keep their order,
 * as the order of entries such as palette colors is meaningful.
 *
 * @param value Value to sort.
 * @return The value with sorted object keys.
 */
function sortObjectKeys( value: unknown ): unknown {
	if ( Array.isArray( value ) ) {
		return value.map( sortObjectKeys );
	}
	if ( value !== null && typeof value === 'object' ) {
		return Object.fromEntries(
			Object.keys( value )
				.sort()
				.map( ( key ) => [
					key,
					sortObjectKeys(
						( value as Record< string, unknown > )[ key ]
					),
				] )
		);
	}
	return value;
}

/**
 * Serializes the styles and settings of a global styles config for a code diff.
 * Revision metadata such as the id, author and date is left out, and keys are
 * sorted, as the REST endpoints and the editor need not order them the same.
 *
 * @param config Global styles config or revision.
 * @return The config's styles and settings as formatted JSON.
 */
export function getStylesRevisionCode(
	config?: Partial< StylesConfig > | null
): string {
	return JSON.stringify(
		sortObjectKeys( {
			settings: config?.settings ?? {},
			styles: config?.styles ?? {},
		} ),
		null,
		2
	);
}

interface StylesRevisionsCodeDiffProps {
	/**
	 * The revision to compare, or `null` when there is none to compare.
	 */
	revision?: Partial< StylesConfig > | null;
	/**
	 * The styles the editor currently shows, unsaved changes included.
	 */
	currentConfig?: Partial< StylesConfig > | null;
}

/**
 * Shows how the current global styles differ from a revision, as a read-only
 * side-by-side diff of their styles and settings: the revision on the start
 * side and the current styles on the end side, as in the canvas header.
 *
 * @param props               Component props.
 * @param props.revision      The revision to compare.
 * @param props.currentConfig The styles the editor currently shows.
 * @return The code diff.
 */
export default function StylesRevisionsCodeDiff( {
	revision,
	currentConfig,
}: StylesRevisionsCodeDiffProps ) {
	const rows = useMemo( () => {
		if ( ! revision ) {
			return [];
		}
		// Matching styles leave nothing to compare, so show the empty message
		// rather than the whole config marked as unchanged. The sidebar's
		// Apply button decides "matching" the same way.
		if (
			areGlobalStylesEqual(
				revision as GlobalStylesConfig,
				( currentConfig ?? {} ) as GlobalStylesConfig
			)
		) {
			return [];
		}
		return getSplitCodeDiffRows(
			getStylesRevisionCode( revision ),
			getStylesRevisionCode( currentConfig )
		);
	}, [ revision, currentConfig ] );

	return (
		<SplitCodeDiffTable
			rows={ rows }
			label={ __( 'Changes since this revision' ) }
			previousLabel={ __( 'Selected revision' ) }
			currentLabel={ __( 'Current version' ) }
			emptyMessage={
				revision
					? __( 'This revision matches the current styles.' )
					: __(
							'Select a revision to compare it with the current styles.'
						)
			}
		/>
	);
}
