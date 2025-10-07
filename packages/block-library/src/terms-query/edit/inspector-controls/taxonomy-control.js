/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePublicTaxonomies } from '../../utils';

export default function TaxonomyControl( {
	attributes,
	setQuery,
	setAttributes,
} ) {
	const { termQuery } = attributes;

	const taxonomies = usePublicTaxonomies();
	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.taxonomy !== 'category' }
			label={ __( 'Taxonomy' ) }
			onDeselect={ () => {
				setQuery( { taxonomy: 'category' } );
			} }
			isShownByDefault
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Taxonomy' ) }
				options={ taxonomyOptions }
				value={ termQuery.taxonomy }
				onChange={ ( selectedTaxonomy ) => {
					setQuery( { taxonomy: selectedTaxonomy } );
					setAttributes( { termsToShow: 'all' } );
				} }
			/>
		</ToolsPanelItem>
	);
}
