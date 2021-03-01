/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockCard( { title, icon, description, blockType } ) {
	if ( blockType ) {
		deprecated( '`blockType` property in `BlockCard component`', {
			alternative: '`title, icon and description` properties',
		} );
		( { title, icon, description } = blockType );
	}
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
