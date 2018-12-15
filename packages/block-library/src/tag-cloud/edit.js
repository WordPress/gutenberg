/**
 * External dependencies
 */
import { map, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	PanelBody,
	Placeholder,
	ToggleControl,
	SelectControl,
	ServerSideRender,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InspectorControls } from '@wordpress/editor';

class TagCloudEdit extends Component {
	constructor() {
		super( ...arguments );

		this.setTaxonomy = this.setTaxonomy.bind( this );
		this.toggleShowTagCounts = this.toggleShowTagCounts.bind( this );
	}

	getTaxonomies() {
		const taxonomies = filter( this.props.taxonomies, 'show_cloud' );

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
		const { attributes } = this.props;
		const { taxonomy, showTagCounts } = attributes;
		const taxonomies = this.getTaxonomies();
		const options = [
			{
				label: __( '- Select -' ),
				value: '',
			},
			...taxonomies,
		];

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Tag Cloud Settings' ) }>
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
				</PanelBody>
			</InspectorControls>
		);

		if ( ! taxonomy ) {
			return (
				<Fragment>
					{ inspectorControls }
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
					</Placeholder>
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ inspectorControls }
				<ServerSideRender
					key="tag-cloud"
					block="core/tag-cloud"
					attributes={ attributes }
				/>
			</Fragment>
		);
	}
}

export default withSelect( ( select ) => {
	return {
		taxonomies: select( 'core' ).getTaxonomies( { per_page: -1 } ),
	};
} )( TagCloudEdit );
