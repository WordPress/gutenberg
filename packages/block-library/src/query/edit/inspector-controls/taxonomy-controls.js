/**
 * WordPress dependencies
 */
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { getEntitiesInfo, useTaxonomies } from '../../utils';
import { MAX_FETCHED_TERMS } from '../../constants';

// Helper function to get the term id based on user input in terms `FormTokenField`.
const getTermIdByTermValue = ( termsMappedByName, termValue ) => {
	// First we check for exact match by `term.id` or case sensitive `term.name` match.
	const termId = termValue?.id || termsMappedByName[ termValue ]?.id;
	if ( termId ) return termId;
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
	for ( const term in termsMappedByName ) {
		if ( term.toLocaleLowerCase() === termValueLower ) {
			return termsMappedByName[ term ].id;
		}
	}
};

function TaxonomyControls( { onChange, query } ) {
	const taxonomies = useTaxonomies( query.postType );
	const taxonomiesInfo = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const termsQuery = { per_page: MAX_FETCHED_TERMS };
			const _taxonomiesInfo = taxonomies?.map( ( { slug, name } ) => {
				const _terms = getEntityRecords( 'taxonomy', slug, termsQuery );
				return {
					slug,
					name,
					terms: getEntitiesInfo( _terms ),
				};
			} );
			return _taxonomiesInfo;
		},
		[ taxonomies ]
	);
	const onTermsChange = ( taxonomySlug ) => ( newTermValues ) => {
		const taxonomyInfo = taxonomiesInfo.find(
			( { slug } ) => slug === taxonomySlug
		);
		if ( ! taxonomyInfo ) return;
		const termIds = Array.from(
			newTermValues.reduce( ( accumulator, termValue ) => {
				const termId = getTermIdByTermValue(
					taxonomyInfo.terms.mapByName,
					termValue
				);
				if ( termId ) accumulator.add( termId );
				return accumulator;
			}, new Set() )
		);
		const newTaxQuery = {
			...query.taxQuery,
			[ taxonomySlug ]: termIds,
		};
		onChange( { taxQuery: newTaxQuery } );
	};
	// Returns only the existing term ids in proper format to be
	// used in `FormTokenField`. This prevents the component from
	// crashing in the editor, when non existing term ids were provided.
	const getExistingTaxQueryValue = ( taxonomySlug ) => {
		const taxonomyInfo = taxonomiesInfo.find(
			( { slug } ) => slug === taxonomySlug
		);
		if ( ! taxonomyInfo ) return [];
		return ( query.taxQuery?.[ taxonomySlug ] || [] ).reduce(
			( accumulator, termId ) => {
				const term = taxonomyInfo.terms.mapById[ termId ];
				if ( term ) {
					accumulator.push( {
						id: termId,
						value: term.name,
					} );
				}
				return accumulator;
			},
			[]
		);
	};
	return (
		<>
			{ !! taxonomiesInfo?.length &&
				taxonomiesInfo.map( ( { slug, name, terms } ) => {
					if ( ! terms?.names?.length ) {
						return null;
					}
					return (
						<FormTokenField
							key={ slug }
							label={ name }
							value={ getExistingTaxQueryValue( slug ) }
							suggestions={ terms.names }
							onChange={ onTermsChange( slug ) }
						/>
					);
				} ) }
		</>
	);
}

export default TaxonomyControls;
