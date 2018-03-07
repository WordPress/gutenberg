/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockIcon, createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { IconButton, withContext } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { getFrecentInserterItems } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

function InserterWithShortcuts( { items, isLocked, onInsert } ) {
	if ( isLocked ) {
		return null;
	}

	const itemsWithoutDefaultBlock = filter( items, ( item ) =>
		item.name !== getDefaultBlockName() || ! isEmpty( item.initialAttributes )
	).slice( 0, 3 );

	return (
		<div className="editor-inserter-with-shortcuts">
			{ itemsWithoutDefaultBlock.map( ( item ) => (
				<IconButton
					key={ item.id }
					className="editor-inserter-with-shortcuts__block"
					onClick={ () => onInsert( item ) }
					label={ sprintf( __( 'Add %s' ), item.title ) }
					icon={ (
						<BlockIcon icon={ item.icon } />
					) }
				/>
			) ) }
		</div>
	);
}

export default compose(
	withContext( 'editor' )( ( settings ) => {
		const { templateLock, blockTypes } = settings;

		return {
			isLocked: !! templateLock,
			enabledBlockTypes: blockTypes,
		};
	} ),
	connect(
		( state, { enabledBlockTypes } ) => ( {
			items: getFrecentInserterItems( state, enabledBlockTypes, 4 ),
		} ),
		( dispatch, { uid, layout } ) => ( {
			onInsert( { name, initialAttributes } ) {
				const block = createBlock( name, { ...initialAttributes, layout } );
				return dispatch( replaceBlocks( uid, block ) );
			},
		} )
	),
)( InserterWithShortcuts );
