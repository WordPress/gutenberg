/**
 * WordPress dependencies
 */
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function BlockEditVisuallyButton( { clientIds, ...props } ) {
	const { block, shouldRender } = useSelect(
		( select ) => {
			const firstBlockClientId = clientIds[ 0 ];
			const { isBlockMultiSelected, getBlockMode, getBlock } =
				select( blockEditorStore );
			const isSingleSelected =
				! isBlockMultiSelected( firstBlockClientId );
			const isHtmlMode = getBlockMode( firstBlockClientId ) === 'html';

			return {
				block: getBlock( firstBlockClientId ),
				shouldRender: isSingleSelected && isHtmlMode,
			};
		},
		[ clientIds[ 0 ] ]
	);

	const { replaceBlocks } = useDispatch( blockEditorStore );
	const onClick = useCallback( () => {
		replaceBlocks(
			block.clientId,
			rawHandler( { HTML: getBlockContent( block ) } )
		);
	}, [ block ] );

	if ( ! shouldRender ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<ToolbarButton onClick={ onClick } { ...props }>
				{ __( 'Edit visually' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
}
