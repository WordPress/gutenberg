/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { BlockRemovalWarningModal } = unlock( blockEditorPrivateApis );

// Prevent accidental removal of certain blocks, asking the user for confirmation first.
const blockRemovalRules = [
	{
		// Query loop.
		postTypes: [ 'wp_template' ],
		callback( removedBlocks ) {
			if ( removedBlocks.some( ( { name } ) => name === 'core/query' ) ) {
				return __(
					'The Query Loop block displays a list of posts or pages, so removing it will prevent that content from displaying.'
				);
			}
		},
	},
	{
		// Post content.
		postTypes: [ 'wp_template' ],
		callback( removedBlocks ) {
			if (
				removedBlocks.some(
					( { name } ) => name === 'core/post-content'
				)
			) {
				return __(
					'Removing the Post Content block will stop your post or page content from displaying on this template.'
				);
			}
		},
	},
	{
		// Post template.
		postTypes: [ 'wp_template', 'post', 'page' ],
		callback( removedBlocks ) {
			if (
				removedBlocks.some(
					( { name } ) => name === 'core/post-template'
				)
			) {
				return __(
					'The Post Template block displays each post or page in a Query Loop, so removing it will stop post content displaying in your query loop.'
				);
			}
		},
	},
	{
		// Pattern overrides.
		postTypes: [ 'wp_block' ],
		callback( removedBlocks ) {
			const hasOverrides = removedBlocks.some(
				( { attributes } ) =>
					attributes?.metadata?.bindings &&
					Object.values( attributes.metadata.bindings ).some(
						( binding ) =>
							binding.source === 'core/pattern-overrides'
					)
			);
			if ( hasOverrides ) {
				return __(
					'Deleting a block with pattern instance overrides can break other blocks on your site that have content linked to it.'
				);
			}
		},
	},
];

export default function BlockRemovalWarnings() {
	const { currentPostType } = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);

	const removalRulesForPostType = useMemo( () => {
		blockRemovalRules.filter( ( rule ) =>
			rule.postTypes.some( ( postType ) => postType === currentPostType )
		);
	}, [ currentPostType ] );

	return <BlockRemovalWarningModal rules={ removalRulesForPostType } />;
}
