/**
 * WordPress dependencies
 */

import { _n } from '@wordpress/i18n';
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
const TEMPLATE_BLOCKS = [
	'core/post-content',
	'core/post-template',
	'core/query',
];
const BLOCK_REMOVAL_RULES = [
	{
		// Template blocks.
		// The warning is only shown when a user manipulates templates or template parts.
		postTypes: [ 'wp_template', 'wp_template_part' ],
		callback( removedBlocks ) {
			const removedTemplateBlocks = removedBlocks.filter( ( { name } ) =>
				TEMPLATE_BLOCKS.includes( name )
			);
			if ( removedTemplateBlocks.length ) {
				return _n(
					'Deleting this block will stop your post or page content from displaying on this template. It is not recommended.',
					'Some of the deleted blocks will stop your post or page content from displaying on this template. It is not recommended.',
					removedBlocks.length
				);
			}
		},
	},
	{
		// Pattern overrides.
		// The warning is only shown when the user edits a pattern.
		postTypes: [ 'wp_block' ],
		callback( removedBlocks ) {
			const removedBlocksWithOverrides = removedBlocks.filter(
				( { attributes } ) =>
					attributes?.metadata?.bindings &&
					Object.values( attributes.metadata.bindings ).some(
						( binding ) =>
							binding.source === 'core/pattern-overrides'
					)
			);
			if ( removedBlocksWithOverrides.length ) {
				return _n(
					'The deleted block allows instance overrides. Removing it may result in content not displaying where this pattern is used. Are you sure you want to proceed?',
					'Some of the deleted blocks allow instance overrides. Removing them may result in content not displaying where this pattern is used. Are you sure you want to proceed?',
					removedBlocks.length
				);
			}
		},
	},
];

export default function BlockRemovalWarnings() {
	const currentPostType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);

	const removalRulesForPostType = useMemo(
		() =>
			BLOCK_REMOVAL_RULES.filter( ( rule ) =>
				rule.postTypes.includes( currentPostType )
			),
		[ currentPostType ]
	);

	// `BlockRemovalWarnings` is rendered in the editor provider, a shared component
	// across react native and web. However, `BlockRemovalWarningModal` is web only.
	// Check it exists before trying to render it.
	if ( ! BlockRemovalWarningModal ) {
		return null;
	}

	if ( ! removalRulesForPostType ) {
		return null;
	}

	return <BlockRemovalWarningModal rules={ removalRulesForPostType } />;
}
