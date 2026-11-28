import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

const MAX_NAMED_TEMPLATES = 3;

/**
 * Describes where a part appears by naming the templates that use it, such as
 * "Used on Index, Pages and 2 more". Template names mean more to people than
 * a count, which would say "1 template" for a header on every page through
 * the Index template.
 *
 * @param templateIds Ids of the templates that use the part.
 * @return The label, or an empty string when no template uses the part.
 */
export function useUsedOnLabel( templateIds: string[] ): string {
	const names = useSelect(
		( select ) =>
			templateIds.map( ( id ) => {
				const record = select( coreStore ).getEditedEntityRecord(
					'postType',
					'wp_template',
					id
				) as { title?: string | { rendered?: string } } | undefined;
				const title =
					typeof record?.title === 'string'
						? record.title
						: record?.title?.rendered;
				return decodeEntities( title ?? '' ) || id.split( '//' )[ 1 ];
			} ),
		[ templateIds ]
	);

	if ( ! names.length ) {
		return '';
	}
	const named = names.slice( 0, MAX_NAMED_TEMPLATES ).join( ', ' );
	const rest = names.length - MAX_NAMED_TEMPLATES;
	if ( rest <= 0 ) {
		return sprintf(
			/* translators: %s: Comma-separated template names, e.g. "Index, Pages". */
			__( 'Used on %s' ),
			named
		);
	}
	return sprintf(
		/* translators: 1: Comma-separated template names, e.g. "Index, Pages, Search". 2: Number of other templates. */
		_n( 'Used on %1$s and %2$d more', 'Used on %1$s and %2$d more', rest ),
		named,
		rest
	);
}
