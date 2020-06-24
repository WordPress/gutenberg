/**
 * External dependencies
 */
import { map, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

function TagCloudEdit( { attributes, setAttributes, taxonomies } ) {
	const { taxonomy, showTagCounts } = attributes;

	const getTaxonomyOptions = () => {
		const selectOption = {
			label: __( '- Select -' ),
			value: '',
			disabled: true,
		};
		const taxonomyOptions = map(
			filter( taxonomies, 'show_cloud' ),
			( item ) => {
				return {
					value: item.slug,
					label: item.name,
				};
			}
		);

		return [ selectOption, ...taxonomyOptions ];
	};

	const toggleShowTagCounts = () => {
		setAttributes( { showTagCounts: ! showTagCounts } );
	};

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Tag Cloud settings' ) }>
				<SelectControl
					label={ __( 'Taxonomy' ) }
					options={ getTaxonomyOptions() }
					value={ taxonomy }
					onChange={ ( selectedTaxonomy ) =>
						setAttributes( { taxonomy: selectedTaxonomy } )
					}
				/>
				<ToggleControl
					label={ __( 'Show post counts' ) }
					checked={ showTagCounts }
					onChange={ toggleShowTagCounts }
				/>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<>
			{ inspectorControls }
			<ServerSideRender
				key="tag-cloud"
				block="core/tag-cloud"
				attributes={ attributes }
			/>
		</>
	);
}

export default withSelect( ( select ) => {
	return {
		taxonomies: select( 'core' ).getTaxonomies(),
	};
} )( TagCloudEdit );
