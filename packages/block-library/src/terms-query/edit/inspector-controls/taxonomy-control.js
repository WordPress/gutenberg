/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { usePublicTaxonomies } from '../../utils';

export default function TaxonomyControl( { value, onChange, ...props } ) {
	const taxonomies = usePublicTaxonomies();
	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	return (
		<SelectControl
			__next40pxDefaultSize
			options={ taxonomyOptions }
			value={ value }
			onChange={ onChange }
			{ ...props }
		/>
	);
}
