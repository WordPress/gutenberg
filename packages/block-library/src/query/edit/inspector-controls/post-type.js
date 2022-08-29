/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePostTypes } from '../../utils';

export function PostType( {
	attributes: {
		query: { inherit, postType, taxQuery },
	},
	setQuery,
} ) {
	const { postTypesSelectOptions, postTypesTaxonomiesMap } = usePostTypes();

	const onPostTypeChange = ( newValue ) => {
		const updateQuery = { postType: newValue };
		// We need to dynamically update the `taxQuery` property,
		// by removing any not supported taxonomy from the query.
		const supportedTaxonomies = postTypesTaxonomiesMap[ newValue ];
		const updatedTaxQuery = Object.entries( taxQuery || {} ).reduce(
			( accumulator, [ taxonomySlug, terms ] ) => {
				if ( supportedTaxonomies.includes( taxonomySlug ) ) {
					accumulator[ taxonomySlug ] = terms;
				}
				return accumulator;
			},
			{}
		);
		updateQuery.taxQuery = !! Object.keys( updatedTaxQuery ).length
			? updatedTaxQuery
			: undefined;

		if ( newValue !== 'post' ) {
			updateQuery.sticky = '';
		}
		// We need to reset `parents` because they are tied to each post type.
		updateQuery.parents = [];
		setQuery( updateQuery );
	};

	return (
		! inherit && (
			<SelectControl
				options={ postTypesSelectOptions }
				value={ postType }
				label={ __( 'Post type' ) }
				onChange={ onPostTypeChange }
				help={ __(
					'WordPress contains different types of content and they are divided into collections called "Post types". By default there are a few different ones such as blog posts and pages, but plugins could add more.'
				) }
			/>
		)
	);
}
