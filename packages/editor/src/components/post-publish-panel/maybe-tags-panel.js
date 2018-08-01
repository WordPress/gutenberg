/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
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

class MaybeTagsPanel extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			hadTags: props.hasTags,
		};
	}

	/*
	 * We use state.hadTags to track whether the post had tags when this
	 * component was first mounted.
	 *
	 * We can't rely on the props.hasTags value to do this check
	 * because when the user adds a tag to a post that didn't have one,
	 * the props.hasTags is going to change from false to true,
	 * forcing a re-render of this component and hiding it when it was previosly shown.
	 *
	 * We take advantage of the fact that the props.hasTags value is undefined
	 * if tags weren't fetched yet, otherwise it will be true of false.
	 *
	 */
	static getDerivedStateFromProps( props, state ) {
		const { hadTags: currentHadTags } = state;
		const { hasTags } = props;
		if ( currentHadTags === undefined && hasTags !== undefined ) {
			return {
				hadTags: hasTags,
			};
		}
		return null;
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

export default compose( [
	withSelect( ( select ) => {
		const postType = select( 'core/editor' ).getCurrentPostType();
		const tags = select( 'core' ).getTaxonomy( 'post_tag' );
		const terms = tags ? select( 'core/editor' ).getEditedPostAttribute( tags.rest_base ) : [];
		return {
			hasTags: tags && terms && terms.length > 0,
			isPostTypeSupported: tags && tags.types.some( ( type ) => type === postType ),
		};
	} ),
] )( MaybeTagsPanel );
