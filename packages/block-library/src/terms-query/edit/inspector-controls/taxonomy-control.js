/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePublicTaxonomies } from '../../utils';

export default function TaxonomyControl( { taxonomy, onChange } ) {
	const taxonomies = usePublicTaxonomies();
	const taxonomyOptions = taxonomies.map( ( _taxonomy ) => ( {
		label: _taxonomy.name,
		value: _taxonomy.slug,
	} ) );

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Taxonomy' ) }
			options={ taxonomyOptions }
			value={ taxonomy }
			onChange={ ( selectedTaxonomy ) => {
				onChange( selectedTaxonomy );
			} }
		/>
	);
}
