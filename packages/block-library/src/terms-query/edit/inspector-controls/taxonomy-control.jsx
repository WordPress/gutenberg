import { SelectControl } from '@wordpress/ui';
import { usePublicTaxonomies } from '../../utils';

export default function TaxonomyControl( { value, onChange, ...props } ) {
	const taxonomies = usePublicTaxonomies();
	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	return (
		<SelectControl
			items={ taxonomyOptions }
			value={
				taxonomyOptions.find( ( item ) => item.value === value ) ?? null
			}
			onValueChange={ ( item ) => {
				if ( item && item.value !== value ) {
					onChange( item.value );
				}
			} }
			{ ...props }
		/>
	);
}
