/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import FlatTermSelector from '../post-taxonomies/flat-term-selector';
import { store as editorStore } from '../../store';

const TagsPanel = () => {
	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'Add tags' ) }
		</span>,
	];

	return (
		<PanelBody initialOpen={ false } title={ panelBodyTitle }>
			<p>
				{ __(
					'Tags help users and search engines navigate your site and find your content. Add a few keywords to describe your post.'
				) }
			</p>
			<FlatTermSelector slug={ 'post_tag' } />
		</PanelBody>
	);
};

class MaybeTagsPanel extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			hadTagsWhenOpeningThePanel: props.hasTags,
		};
	}

	/*
	 * We only want to show the tag panel if the post didn't have
	 * any tags when the user hit the Publish button.
	 *
	 * We can't use the prop.hasTags because it'll change to true
	 * if the user adds a new tag within the pre-publish panel.
	 * This would force a re-render and a new prop.hasTags check,
	 * hiding this panel and keeping the user from adding
	 * more than one tag.
	 */
	render() {
		if ( ! this.state.hadTagsWhenOpeningThePanel ) {
			return <TagsPanel />;
		}

		return null;
	}
}

export default compose(
	withSelect( ( select ) => {
		const postType = select( editorStore ).getCurrentPostType();
		const tagsTaxonomy = select( coreStore ).getTaxonomy( 'post_tag' );
		const tags =
			tagsTaxonomy &&
			select( editorStore ).getEditedPostAttribute(
				tagsTaxonomy.rest_base
			);
		return {
			areTagsFetched: tagsTaxonomy !== undefined,
			isPostTypeSupported:
				tagsTaxonomy &&
				tagsTaxonomy.types.some( ( type ) => type === postType ),
			hasTags: tags && tags.length,
		};
	} ),
	ifCondition(
		( { areTagsFetched, isPostTypeSupported } ) =>
			isPostTypeSupported && areTagsFetched
	)
)( MaybeTagsPanel );
