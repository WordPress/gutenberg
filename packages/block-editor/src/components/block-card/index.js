/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockCard( { blockType: { icon, title, description } } ) {
	return (
		<div className="block-editor-block-card">
			<BlockIcon icon={ icon } showColors />
			<div className="block-editor-block-card__content">
				<h2 className="block-editor-block-card__title">{ title }</h2>
				<span className="block-editor-block-card__description">
					{ description }
				</span>
			</div>
		</div>
	);
}

export default BlockCard;
