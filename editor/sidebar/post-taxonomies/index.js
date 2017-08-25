/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, withAPIData } from '@wordpress/components';

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

function PostTaxonomies( { postType, taxonomies, isOpened, onTogglePanel } ) {
	const availableTaxonomies = !! taxonomies.data
		? Object.values( taxonomies.data ).filter( ( taxonomy ) => taxonomy.types.indexOf( postType ) !== -1 )
		: [];

	if ( ! availableTaxonomies.length ) {
		return null;
	}

	return (
		<PanelBody
			title={ __( 'Categories & Tags' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
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

const applyConnect = connect(
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
);

const applyWithAPIData = withAPIData( () => ( {
	taxonomies: '/wp/v2/taxonomies?context=edit',
} ) );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
] )( PostTaxonomies );

