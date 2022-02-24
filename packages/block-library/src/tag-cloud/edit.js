/**
 * External dependencies
 */
import { map, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	RangeControl,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
// import { useServerSideRender } from '@wordpress/server-side-render';
import ServerSideRender from '@wordpress/server-side-render';

/**
 * Minimum number of tags a user can show using this block.
 *
 * @type {number}
 */
const MIN_TAGS = 1;

/**
 * Maximum number of tags a user can show using this block.
 *
 * @type {number}
 */
const MAX_TAGS = 100;

function TagCloudEdit( { attributes, setAttributes, taxonomies } ) {
	const { taxonomy, showTagCounts, numberOfTags } = attributes;

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
					onChange={ () =>
						setAttributes( { showTagCounts: ! showTagCounts } )
					}
				/>
				<RangeControl
					label={ __( 'Number of tags' ) }
					value={ numberOfTags }
					onChange={ ( value ) =>
						setAttributes( { numberOfTags: value } )
					}
					min={ MIN_TAGS }
					max={ MAX_TAGS }
					required
				/>
			</PanelBody>
		</InspectorControls>
	);

	// const renderedContent = useServerSideRender( {
	// 	key: 'tag-cloud',
	// 	block: 'core/tag-cloud',
	// 	attributes,
	// } );

	return (
		<>
			{ inspectorControls }
			<div { ...useBlockProps() }>
				<ServerSideRender
					key="tag-cloud"
					block="core/tag-cloud"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}

export default withSelect( ( select ) => {
	return {
		taxonomies: select( coreStore ).getTaxonomies( { per_page: -1 } ),
	};
} )( TagCloudEdit );
