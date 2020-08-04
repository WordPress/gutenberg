/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockCard( { blockType } ) {
	return (
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
	);
}

export default BlockCard;
