/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import HierarchicalTermSelector from './hierarchical-term-selector';
import FlatTermSelector from './flat-term-selector';
import { getCurrentPostType, isEditorSidebarPanelOpened } from '../../selectors';
import { toggleSidebarPanel } from '../../actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-taxonomies';

class PostTaxonomies extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			taxonomies: [],
		};
	}

	componentDidMount() {
		this.fetchTaxonomies = new wp.api.collections.Taxonomies()
			.fetch()
			.done( ( taxonomies ) => {
				this.setState( { taxonomies: Object.values( taxonomies ) } );
			} );
	}

	componentWillUnmout() {
		this.fetchTaxonomies.abort();
	}

	render() {
		const availableTaxonomies = this.state.taxonomies
			.filter( ( taxonomy ) => taxonomy.types.indexOf( this.props.postType ) !== -1 );

		if ( ! availableTaxonomies.length ) {
			return null;
		}

		return (
			<PanelBody
				title={ __( 'Categories & Tags' ) }
				opened={ this.props.isOpened }
				onToggle={ this.props.onTogglePanel }
			>
				{ availableTaxonomies.map( ( taxonomy ) => {
					const TaxonomyComponent = taxonomy.hierarchical ? HierarchicalTermSelector : FlatTermSelector;
					return (
						<TaxonomyComponent
							key={ taxonomy.slug }
							label={ taxonomy.name }
							restBase={ taxonomy.rest_base }
							slug={ taxonomy.slug }
						/>
					);
				} ) }
			</PanelBody>
		);
	}
}

export default connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	}
)( PostTaxonomies );

