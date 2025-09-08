/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';

export default function TaxonomyControl( {
	termQuery,
	setQuery,
	taxonomyOptions,
} ) {
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
