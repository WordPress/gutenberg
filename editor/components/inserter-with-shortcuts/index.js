/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

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
import Inserter from '../inserter';
import { getRecentInserterItems } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

function InserterWithShortcuts( { items, isLocked, onToggle, onInsert } ) {
	if ( isLocked ) {
		return null;
	}

	const itemsWithTheDefaultBlock =
		filter( items, ( item ) => item.name !== getDefaultBlockName() || ! item.initialAttributes )
			.slice( 0, 2 );

	return (
		<div className="editor-inserter-with-shortcuts">
			<Inserter
				position="top left"
				onToggle={ onToggle }
			/>

			{ itemsWithTheDefaultBlock.map( ( item ) => (
				<IconButton
					key={ item.id }
					className="editor-inserter-with-shortcuts__block"
					onClick={ () => onInsert( item ) }
					label={ sprintf( __( 'Add %s' ), item.title ) }
					icon={ (
						<span className="editor-inserter-with-shortcuts__block-icon">
							<BlockIcon icon={ item.icon } />
						</span>
					) }
				/>
			) ) }
		</div>
	);
}

export default compose(
	connect(
		( state ) => ( {
			items: getRecentInserterItems( state, true, 3 ),
		} ),
		( dispatch, { uid, layout } ) => ( {
			onInsert( { name, initialAttributes } ) {
				const block = createBlock( name, { ...initialAttributes, layout } );
				return dispatch( replaceBlocks( uid, block ) );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( InserterWithShortcuts );
