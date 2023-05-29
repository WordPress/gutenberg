/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../private-apis';

const { useBlockEditingMode } = unlock( blockEditorPrivateApis );

export default function PatternTemplateTokenEdit( { clientId } ) {
	useBlockEditingMode( 'disabled' );

	const placeholderBlock = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockParentsByBlockName,
				getClientIdsOfDescendants,
				getBlockOrder,
				getBlock,
			} = select( blockEditorStore );
			const [ contentClientId ] = getBlockParentsByBlockName(
				clientId,
				'core/pattern-template-content',
				true
			);

			// Find the index of this block compared to other token blocks.
			const flattenedClientIds = getClientIdsOfDescendants( [
				contentClientId,
			] );
			const tokenBlocks = getBlocksByClientId(
				flattenedClientIds
			).filter( ( { name } ) => name === 'core/pattern-template-token' );
			const myPosition = tokenBlocks.findIndex(
				( { clientId: tokenClientId } ) => tokenClientId === clientId
			);

			// Use the index of the token to get the placeholder block.
			const [ templateClientId ] = getBlockParentsByBlockName(
				clientId,
				'core/pattern-template',
				true
			);
			const [ , ...placeholderClientIds ] =
				getBlockOrder( templateClientId );
			const placeholderClientId = placeholderClientIds[ myPosition ];

			return getBlock( placeholderClientId );
		},
		[ clientId ]
	);

	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			{ `Token for ${ placeholderBlock?.name } (clientId: ${ placeholderBlock?.clientId })` }
		</div>
	);
}
