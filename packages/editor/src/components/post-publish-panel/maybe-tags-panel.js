/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Dashicon, PanelBody } from '@wordpress/components';

import FlatTermSelector from '../post-taxonomies/flat-term-selector';

const TagsPanel = () => <PanelBody initialOpen={ true } title={ [
	<Dashicon key={ 'dashicon-lightbulb' } icon={ 'lightbulb' } />,
	__( 'Tip:' ),
	<span className="editor-post-publish-panel__link" key="label">{
		__( 'Add tags to your post' )
	}</span>,
] }>
	<FlatTermSelector slug={ 'post_tag' } />
</PanelBody>;

const MaybeTagsPanel = ( { hasTags } ) => {
	if ( ! hasTags ) {
		return null;
	}
	return ( <TagsPanel /> );
};

export default compose( [
	withSelect( ( select ) => {
		const postType = select( 'core/editor' ).getCurrentPostType();
		const tags = select( 'core' ).getTaxonomy( 'post_tag' );
		return {
			hasTags: tags && tags.types.some( ( type ) => type === postType ),
		};
	} ),
] )( MaybeTagsPanel );
