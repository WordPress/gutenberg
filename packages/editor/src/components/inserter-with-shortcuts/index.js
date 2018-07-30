/**
 * External dependencies
 */
import { filter, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { IconButton } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function InserterWithShortcuts( { items, isLocked, onInsert } ) {
	if ( isLocked ) {
		return null;
	}

	const itemsWithoutDefaultBlock = filter( items, ( item ) => {
		return ! item.isDisabled && (
			item.name !== getDefaultBlockName() ||
			! isEmpty( item.initialAttributes )
		);
	} ).slice( 0, 3 );

	return (
		<div className="editor-inserter-with-shortcuts">
			{ itemsWithoutDefaultBlock.map( ( item ) => (
				<IconButton
					key={ item.id }
					className="editor-inserter-with-shortcuts__block"
					onClick={ () => onInsert( item ) }
					// translators: %s: block title/name to be added
					label={ sprintf( __( 'Add %s' ), item.title ) }
					icon={ (
						<BlockIcon icon={ item.icon && item.icon.src } />
					) }
				/>
			) ) }
		</div>
	);
}

export default compose(
	withSelect( ( select, { rootClientId } ) => {
		const { getInserterItems, getTemplateLock } = select( 'core/editor' );
		return {
			items: getInserterItems( rootClientId ),
			isLocked: !! getTemplateLock( rootClientId ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { clientId, rootClientId, layout } = ownProps;

		return {
			onInsert( { name, initialAttributes } ) {
				const block = createBlock( name, { ...initialAttributes, layout } );
				if ( clientId ) {
					dispatch( 'core/editor' ).replaceBlocks( clientId, block );
				} else {
					dispatch( 'core/editor' ).insertBlock( block, undefined, rootClientId );
				}
			},
		};
	} ),
)( InserterWithShortcuts );
