/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { store as blocksStore } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Adjusts the labels of the post title, featured image, and content blocks so
 * that they say 'Page' instead of 'Post'.
 */
export function useRemovePostFromContentBlockLabels() {
	const { __experimentalReapplyBlockTypeFilters } =
		useDispatch( blocksStore );
	useEffect( () => {
		addFilter(
			'blocks.registerBlockType',
			'core/edit-site/remove-post-from-content-block-labels',
			removePostFromContentBlockLabels
		);
		__experimentalReapplyBlockTypeFilters();
		return () => {
			removeFilter(
				'blocks.registerBlockType',
				'core/edit-site/remove-post-from-content-block-labels'
			);
			__experimentalReapplyBlockTypeFilters();
		};
	}, [] );
}

function removePostFromContentBlockLabels( settings, name ) {
	switch ( name ) {
		case 'core/post-title':
			settings.__experimentalLabel = () => __( 'Page Title' );
			break;
		case 'core/post-featured-image':
			settings.__experimentalLabel = () => __( 'Page Featured Image' );
			break;
		case 'core/post-content':
			settings.__experimentalLabel = () => __( 'Page Content' );
			break;
	}
	return settings;
}
