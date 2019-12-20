/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockCard( { blockType } ) {
	return (
		<div className="block-editor-block-card">
			<BlockIcon icon={ blockType.icon } showColors />
			<div className="block-editor-block-card__content">
				<div className="block-editor-block-card__title">{ blockType.title }</div>
				<div className="block-editor-block-card__description">{ blockType.description }</div>
			</div>
		</div>
	);
}

export default BlockCard;
