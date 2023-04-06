/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Returns a generator converting one or more static blocks into a pattern.
 *
 * @param {string[]} clientIds The client IDs of the block to detach.
 * @param {string}   title     Pattern title.
 */
export const __experimentalConvertBlocksToPattern =
	( clientIds, title ) =>
	async ( { registry } ) => {
		const pattern = {
			title: title || __( 'Untitled Pattern' ),
			content: serialize(
				registry
					.select( blockEditorStore )
					.getBlocksByClientId( clientIds )
			),
			status: 'publish',
		};

		await registry
			.dispatch( 'core' )
			.saveEntityRecord( 'postType', 'wp_block_pattern', pattern );
	};
