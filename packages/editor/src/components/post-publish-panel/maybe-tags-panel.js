/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { compose, ifCondition } from '@wordpress/compose';
import { useSelect, select } from '@wordpress/data';
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

const MaybeTagsPanel = () => {
	const { tags } = useSelect( ( _select ) => {
		const tagsTaxonomy = _select( coreStore ).getTaxonomy( 'post_tag' );
		const _tags =
			tagsTaxonomy &&
			_select( editorStore ).getEditedPostAttribute(
				tagsTaxonomy.rest_base
			);
		return {
			tags: _tags,
		};
	}, [] );
	const hasTags = tags && tags.length;
	const [ hadTagsWhenOpeningThePanel ] = useState( hasTags );

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
	if ( ! hadTagsWhenOpeningThePanel ) {
		return <TagsPanel />;
	}

	return null;
};

export default compose(
	ifCondition( () => {
		const postType = select( editorStore ).getCurrentPostType();
		const tagsTaxonomy = select( coreStore ).getTaxonomy( 'post_tag' );
		const isPostTypeSupported =
			tagsTaxonomy &&
			tagsTaxonomy.types.some( ( type ) => type === postType );
		const areTagsFetched = tagsTaxonomy !== undefined;

		return isPostTypeSupported && areTagsFetched;
	} )
)( MaybeTagsPanel );
