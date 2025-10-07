/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { usePublicTaxonomies } from '../../utils';

export default function TaxonomyControl( { taxonomy, onChange, ...props } ) {
	const taxonomies = usePublicTaxonomies();
	const taxonomyOptions = taxonomies.map( ( _taxonomy ) => ( {
		label: _taxonomy.name,
		value: _taxonomy.slug,
	} ) );

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			options={ taxonomyOptions }
			value={ taxonomy }
			onChange={ onChange }
			{ ...props }
		/>
	);
}
