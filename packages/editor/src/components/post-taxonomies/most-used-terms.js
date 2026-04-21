/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unescapeTerms } from '../../utils/terms';

const MIN_MOST_USED_TERMS = 3;
const DEFAULT_QUERY = {
	per_page: 10,
	orderby: 'count',
	order: 'desc',
	hide_empty: true,
	_fields: 'id,name,count',
	context: 'view',
};

export default function MostUsedTerms( { onSelect, taxonomy } ) {
	const { _terms, showTerms } = useSelect(
		( select ) => {
			const mostUsedTerms = select( coreStore ).getEntityRecords(
				'taxonomy',
				taxonomy.slug,
				DEFAULT_QUERY
			);
			return {
				_terms: mostUsedTerms,
				showTerms: mostUsedTerms?.length >= MIN_MOST_USED_TERMS,
			};
		},
		[ taxonomy.slug ]
	);

	if ( ! showTerms ) {
		return null;
	}

	const terms = unescapeTerms( _terms );

	return (
		<div className="editor-post-taxonomies__flat-term-most-used">
			<BaseControl.VisualLabel
				as="h3"
				className="editor-post-taxonomies__flat-term-most-used-label"
			>
				{ taxonomy.labels.most_used }
			</BaseControl.VisualLabel>
			{ /*
			 * Disable reason: The `list` ARIA role is redundant but
			 * Safari+VoiceOver won't announce the list otherwise.
			 */
			/* eslint-disable jsx-a11y/no-redundant-roles */ }
			<ul
				role="list"
				className="editor-post-taxonomies__flat-term-most-used-list"
			>
				{ terms.map( ( term ) => (
					<li key={ term.id }>
						<Button
							__next40pxDefaultSize
							variant="link"
							onClick={ () => onSelect( term ) }
						>
							{ term.name }
						</Button>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</div>
	);
}
