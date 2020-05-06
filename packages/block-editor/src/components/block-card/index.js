/**
 * WordPress dependencies
 */
import { Tip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

// const contextualTip = select( 'core/block-editor' ).__experimentalGetBlockInserterTipByContext( context, true );

// console.log( { __experimentalGetBlockTipByType } );

function BlockCard( { blockType, tip } ) {
	return (
		<>
			<div className="block-editor-block-card">
				<BlockIcon icon={ blockType.icon } showColors />
				<div className="block-editor-block-card__content">
					<h2 className="block-editor-block-card__title">
						{ blockType.title }
					</h2>
					<span className="block-editor-block-card__description">
						{ blockType.description }
					</span>
				</div>
			</div>
			{ tip && (
				<div className="block-editor-block-card">
					<div className="block-editor-block-card__tip">
						<Tip>{ tip }</Tip>
					</div>
				</div>
			) }
		</>
	);
}

export default BlockCard;
