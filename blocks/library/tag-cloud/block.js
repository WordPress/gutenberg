/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { ToggleControl, SelectControl, withAPIData } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../../inspector-controls';

class TagCloudBlock extends Component {
	constructor() {
		super( ...arguments );

		this.setTaxonomy = this.setTaxonomy.bind( this );
		this.toggleShowTagCounts = this.toggleShowTagCounts.bind( this );
	}

	getTaxonomies() {
		const taxonomies = this.props.taxonomies.data;

		if ( ! taxonomies ) {
			return [];
		}

		return map( taxonomies, taxonomy => {
			return {
				value: taxonomy.rest_base,
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
		const { attributes, focus } = this.props;
		const { taxonomy, showTagCounts } = attributes;
		const taxonomies = this.getTaxonomies();

		const inspectorControls = focus && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Tag Cloud Settings' ) }</h3>
				<SelectControl
					label={ __( 'Taxonomy' ) }
					options={ taxonomies }
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
				'Taxonomy not selected...',
			];
		}

		return [
			inspectorControls,
			taxonomy,
		];
	}
}

export default withAPIData( () => {
	return {
		taxonomies: '/wp/v2/taxonomies',
	};
} )( TagCloudBlock );
