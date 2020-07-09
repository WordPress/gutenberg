/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__experimentalBlock as Block,
	__experimentalQuickInserter as QuickInserter,
	InnerBlocks,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';

// const DefaultButtonBlockAppender = () => (
// 	<InnerBlocks.ButtonBlockAppender className="block-list-appender__toggle" />
// );

export default function NavigationItemEdit( { clientId } ) {
	const hasInnerBlocks = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getBlockCount( clientId ) > 0,
		[ clientId ]
	);

	return (
		<Block.li>
			<InnerBlocks
				allowedBlocks={ [
					'core/image',
					'core/paragraph',
					'core/search',
					'core/separator',
					'core/social-links',
					'core/spacer',
				] }
				renderAppender={ false }
			/>
			{ ! hasInnerBlocks && (
				<Popover className="block-editor-inserter block-editor-inserter__popover is-quick">
					<QuickInserter
						rootClientId={ clientId }
						clientId={ clientId }
						isAppender
						selectBlockOnInsert
					/>
				</Popover>
			) }
		</Block.li>
	);
}
