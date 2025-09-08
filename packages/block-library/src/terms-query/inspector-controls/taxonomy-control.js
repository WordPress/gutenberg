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
	taxonomyOptions,
	setAttributes,
} ) {
	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.taxonomy !== 'category' }
			label={ __( 'Taxonomy' ) }
			onDeselect={ () =>
				setAttributes( {
					termQuery: { ...termQuery, taxonomy: 'category' },
					termsSelection: 'all',
				} )
			}
			isShownByDefault
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Taxonomy' ) }
				options={ taxonomyOptions }
				value={ termQuery.taxonomy }
				onChange={ ( selectedTaxonomy ) =>
					setAttributes( {
						termQuery: { ...termQuery, taxonomy: selectedTaxonomy },
						termsSelection: 'all',
					} )
				}
			/>
		</ToolsPanelItem>
	);
}
