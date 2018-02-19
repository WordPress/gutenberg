/**
 * External dependencies
 */
import { map } from 'lodash';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Placeholder,
	ToggleControl,
	SelectControl,
	withAPIData,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TermList from './term-list';
import InspectorControls from '../../inspector-controls';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

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
			focus,
			setAttributes,
			termList,
			className,
		} = this.props;
		const { taxonomy, showTagCounts, align } = attributes;
		const taxonomies = this.getTaxonomies();
		const options = [
			{
				label: __( '- Select -' ),
				value: '',
			},
			...taxonomies,
		];
		const terms = termList.data ? (
			<TermList
				terms={ termList.data }
				showTagCounts={ showTagCounts }
				className={ className }
			/>
		) : (
			[]
		);

		const inspectorControls = focus && (
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
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ nextAlign => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'left', 'center', 'right', 'full' ] }
					/>
				</BlockControls>
			),
			terms,
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
		taxonomies: '/wp/v2/taxonomies',
		termList: `/wp/v2/${ taxonomyRestBase }?${ queryString }`,
	};
} )( TagCloudBlock );
