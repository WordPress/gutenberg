/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { BlockRemovalWarningModal } = unlock( blockEditorPrivateApis );

// Prevent accidental removal of certain blocks, asking the user for confirmation first.
const blockRemovalRules = {
	'core-query': {
		message: __(
			'The Query Loop block displays a list of posts or pages, so removing it will prevent that content from displaying.'
		),
		postTypes: [ 'wp_template' ],
		callback: ( blockName, ruleKeysForPrompt ) => {
			if ( blockName === 'core/query' ) {
				ruleKeysForPrompt.add( 'core-query' );
			}
		},
	},
	'core-post-content': {
		message: __(
			'Removing the Post Content block will stop your post or page content from displaying on this template.'
		),
		postTypes: [ 'wp_template' ],
		callback: ( blockName, ruleKeysForPrompt ) => {
			if ( blockName === 'core/post-content' ) {
				ruleKeysForPrompt.add( 'core-post-content' );
			}
		},
	},
	'core-post-template': {
		message: __(
			'The Post Template block displays each post or page in a Query Loop, so removing it will stop post content displaying in your query loop.'
		),
		postTypes: [ 'wp_template', 'post', 'page' ],
		callback: ( blockName, ruleKeysForPrompt ) => {
			if ( blockName === 'core/post-template' ) {
				ruleKeysForPrompt.add( 'core-post-template' );
			}
		},
	},
	'core-pattern-overrides': {
		message: __(
			'Deleting a block with pattern instance overrides can break other blocks on your site that have content linked to it.'
		),
		postTypes: [ 'wp_block' ],
		callback: ( blockName, ruleKeysForPrompt, blockAttributes ) => {
			if (
				blockAttributes?.metadata?.bindings &&
				JSON.stringify( blockAttributes.metadata.bindings ).includes(
					'core/pattern-overrides'
				)
			) {
				ruleKeysForPrompt.add( 'core-pattern-overrides' );
			}
		},
	},
};

export default function BlockRemovalWarnings() {
	const { currentPostType } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );

		return {
			currentPostType: getCurrentPostType(),
		};
	}, [] );
	blockRemovalRules.currentPostType = currentPostType;
	return <BlockRemovalWarningModal rules={ blockRemovalRules } />;
}
