/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Dashicon, PanelBody } from '@wordpress/components';

import FlatTermSelector from '../post-taxonomies/flat-term-selector';

const TagsPanel = () => <PanelBody initialOpen={ false } title={ [
	<Dashicon key={ 'dashicon-lightbulb' } icon={ 'lightbulb' } />,
	__( 'Tip:' ),
	<span className="editor-post-publish-panel__link" key="label">{
		__( 'Add tags to your post' )
	}</span>,
] }>
	<FlatTermSelector slug={ 'post_tag' } />
</PanelBody>;

class MaybeTagsPanel extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			hadTags: props.hasTags,
		};
	}

	render() {
		const { isPostTypeSupported } = this.props;
		const { hadTags } = this.state;
		if ( ! isPostTypeSupported || hadTags ) {
			return null;
		}
		return ( <TagsPanel /> );
	}
}

export default compose(
	withSelect( ( select ) => {
		const postType = select( 'core/editor' ).getCurrentPostType();
		const tags = select( 'core' ).getTaxonomy( 'post_tag' );
		const terms = tags ? select( 'core/editor' ).getEditedPostAttribute( tags.rest_base ) : [];
		return {
			hasTags: tags && terms && terms.length > 0,
			isPostTypeSupported: tags && tags.types.some( ( type ) => type === postType ),
		};
	} ),
	ifCondition( ( { hasTags } ) => hasTags !== undefined ),
)( MaybeTagsPanel );
