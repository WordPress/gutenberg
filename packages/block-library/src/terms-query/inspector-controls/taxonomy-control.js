/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function TaxonomyControl( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	const { taxonomies } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const allTaxonomies = getEntityRecords( 'root', 'taxonomy' );
		return {
			taxonomies:
				allTaxonomies?.filter( ( t ) => t.visibility.public ) || [],
		};
	}, [] );

	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.taxonomy !== 'category' }
			label={ __( 'Taxonomy' ) }
			onDeselect={ () => setQuery( { taxonomy: 'category' } ) }
			isShownByDefault
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Taxonomy' ) }
				options={ taxonomyOptions }
				value={ termQuery.taxonomy }
				onChange={ ( selectedTaxonomy ) =>
					setQuery( { taxonomy: selectedTaxonomy } )
				}
			/>
		</ToolsPanelItem>
	);
}
