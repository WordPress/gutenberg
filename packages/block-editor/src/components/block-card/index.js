/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockTitle from '../block-title';
import BlockDescription from '../block-description';

function BlockCard( { clientId, blockType } ) {
	const props = ( clientId && { clientId } ) || blockType;
	return (
		<div className="block-editor-block-card">
			<BlockIcon { ...props } showColors />
			<div className="block-editor-block-card__content">
				<h2 className="block-editor-block-card__title">
					<BlockTitle { ...props } />
				</h2>
				<span className="block-editor-block-card__description">
					<BlockDescription { ...props } />
				</span>
			</div>
		</div>
	);
}

export default BlockCard;
