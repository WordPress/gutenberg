/**
 * WordPress dependencies
 */
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useTaxonomies } from '../../utils';
import { MAX_FETCHED_TERMS } from '../../constants';

// Helper function to get the term id based on user input in terms `FormTokenField`.
const getTermIdByTermValue = ( terms, termValue ) => {
	// First we check for exact match by `term.id` or case sensitive `term.name` match.
	const termId =
		termValue?.id || terms.find( ( term ) => term.name === termValue )?.id;
	if ( termId ) {
		return termId;
	}

	/**
	 * Here we make an extra check for entered terms in a non case sensitive way,
	 * to match user expectations, due to `FormTokenField` behaviour that shows
	 * suggestions which are case insensitive.
	 *
	 * Although WP tries to discourage users to add terms with the same name (case insensitive),
	 * it's still possible if you manually change the name, as long as the terms have different slugs.
	 * In this edge case we always apply the first match from the terms list.
	 */
	const termValueLower = termValue.toLocaleLowerCase();
	return terms.find(
		( term ) => term.name.toLocaleLowerCase() === termValueLower
	)?.id;
};

const useTaxonomyTerms = ( slug ) => {
	return useSelect(
		( select ) => {
			const terms = select( coreStore ).getEntityRecords(
				'taxonomy',
				slug,
				{ context: 'view', per_page: MAX_FETCHED_TERMS }
			);
			return { terms };
		},
		[ slug ]
	);
};

export function TaxonomyControls( { onChange, query } ) {
	const { postType, taxQuery } = query;

	const taxonomies = useTaxonomies( postType );
	if ( ! taxonomies || taxonomies.length === 0 ) {
		return null;
	}

	return (
		<>
			{ taxonomies.map( ( taxonomy ) => {
				const value = taxQuery?.[ taxonomy.slug ] || [];
				const handleChange = ( newTermIds ) =>
					onChange( {
						taxQuery: {
							...taxQuery,
							[ taxonomy.slug ]: newTermIds,
						},
					} );

				return (
					<TaxonomyItem
						key={ taxonomy.slug }
						taxonomy={ taxonomy }
						value={ value }
						onChange={ handleChange }
					/>
				);
			} ) }
		</>
	);
}
function TaxonomyItem( { taxonomy, value, onChange } ) {
	const { terms } = useTaxonomyTerms( taxonomy.slug );
	if ( ! terms?.length ) {
		return null;
	}

	const onTermsChange = ( newTermValues ) => {
		const termIds = new Set();
		for ( const termValue of newTermValues ) {
			const termId = getTermIdByTermValue( terms, termValue );
			if ( termId ) {
				termIds.add( termId );
			}
		}

		onChange( Array.from( termIds ) );
	};

	// Selects only the existing term ids in proper format to be
	// used in `FormTokenField`. This prevents the component from
	// crashing in the editor, when non existing term ids were provided.
	const taxQueryValue = value
		.map( ( termId ) => terms.find( ( t ) => t.id === termId ) )
		.filter( Boolean )
		.map( ( term ) => ( { id: term.id, value: term.name } ) );

	return (
		<div className="block-library-query-inspector__taxonomy-control">
			<FormTokenField
				label={ taxonomy.name }
				value={ taxQueryValue }
				suggestions={ terms.map( ( t ) => t.name ) }
				onChange={ onTermsChange }
				__experimentalShowHowTo={ false }
			/>
		</div>
	);
}
