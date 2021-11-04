/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CopyPatternControl( { clientId } ) {
	const { innerBlocks, navigationBlock } = useSelect(
		( select ) => {
			const { getBlock, getBlocks } = select( blockEditorStore );
			return {
				innerBlocks: getBlocks( clientId ),
				navigationBlock: getBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const getClipboardText = useCallback( () => {
		// Remove the `navigationMenuId` so that the block is rendered with
		// serialized inner blocks (see the definition of `save`). Also
		// add the `innerBlocks` as controlled inner blocks aren't returned
		// by the `getBlock` selector.
		const navBlockWithoutId = {
			...navigationBlock,
			attributes: {
				...navigationBlock.attributes,
				navigationMenuId: undefined,
			},
			innerBlocks,
		};
		return serialize( navBlockWithoutId );
	}, [ navigationBlock, innerBlocks ] );

	const ref = useCopyToClipboard( getClipboardText );

	return (
		<Button
			ref={ ref }
			variant="secondary"
			className="wp-block-navigation-copy-pattern-button"
		>
			{ __( 'Copy pattern' ) }
		</Button>
	);
}
