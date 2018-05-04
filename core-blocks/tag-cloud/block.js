/**
 * External dependencies
 */
import { map, filter } from 'lodash';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Placeholder,
	ToggleControl,
	SelectControl,
	ServerSideRender,
	withAPIData,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InspectorControls } from '@wordpress/blocks';

class TagCloudBlock extends Component {
	constructor() {
		super( ...arguments );

		this.setTaxonomy = this.setTaxonomy.bind( this );
		this.toggleShowTagCounts = this.toggleShowTagCounts.bind( this );
	}

	getTaxonomies() {
		const taxonomies = filter( this.props.taxonomies.data, 'show_cloud' );

		return map( taxonomies, ( taxonomy ) => {
			return {
				value: taxonomy.slug,
				label: taxonomy.name,
			};
		} );
	}

	setTaxonomy( taxonomy ) {
		const { setAttributes } = this.props;

		setAttributes( { taxonomy } );
	}

	toggleShowTagCounts() {
		const { attributes, setAttributes } = this.props;
		const { showTagCounts } = attributes;

		setAttributes( { showTagCounts: ! showTagCounts } );
	}

	render() {
		const {
			attributes,
			isSelected,
		} = this.props;
		const { taxonomy, showTagCounts } = attributes;
		const taxonomies = this.getTaxonomies();
		const options = [
			{
				label: __( '- Select -' ),
				value: '',
			},
			...taxonomies,
		];

		const inspectorControls = isSelected && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Tag Cloud Settings' ) }</h3>
				<SelectControl
					label={ __( 'Taxonomy' ) }
					options={ options }
					value={ taxonomy }
					onChange={ this.setTaxonomy }
				/>
				<ToggleControl
					label={ __( 'Show tag counts' ) }
					checked={ showTagCounts }
					onChange={ this.toggleShowTagCounts }
				/>
			</InspectorControls>
		);

		if ( ! taxonomy ) {
			return [
				inspectorControls,
				<Placeholder
					key="placeholder"
					icon="tag"
					label={ __( 'Tag Cloud' ) }
					instructions={ __( 'Select a Taxonomy' ) }
				>
					<SelectControl
						options={ options }
						onChange={ this.setTaxonomy }
					/>
				</Placeholder>,
			];
		}

		return [
			inspectorControls,
			<ServerSideRender
				key="tag-cloud"
				block="core/tag-cloud"
				attributes={ attributes }
			/>,
		];
	}
}

export default withAPIData( ( props, { taxonomy } ) => {
	const taxonomyRestBase = taxonomy( props.attributes.taxonomy );
	const queryString = stringify( {
		hide_empty: true,
		per_page: 100,
	} );

	return {
		taxonomies: '/wp/v2/taxonomies?context=edit',
		termList: `/wp/v2/${ taxonomyRestBase }?${ queryString }`,
	};
} )( TagCloudBlock );
