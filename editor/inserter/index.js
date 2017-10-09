/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getEditorMode } from '../selectors';
import { insertBlock, hideInsertionPoint } from '../actions';

function Inserter( { position, children, onInsertBlock, insertionPoint } ) {
	return (
		<Dropdown
			className="editor-inserter"
			position={ position }
			renderToggle={ ( { onToggle, isOpen } ) => (
				<IconButton
					icon="insert"
					label={ __( 'Insert block' ) }
					onClick={ onToggle }
					className="editor-inserter__toggle"
					aria-haspopup="true"
					aria-expanded={ isOpen }
				>
					{ children }
				</IconButton>
			) }
			renderContent={ ( { onClose } ) => {
				const onInsert = ( name ) => {
					onInsertBlock(
						name,
						insertionPoint
					);

					onClose();
				};

				return <InserterMenu onSelect={ onInsert } />;
			} }
		/>
	);
}

export default connect(
	( state ) => {
		return {
			insertionPoint: getBlockInsertionPoint( state ),
			mode: getEditorMode( state ),
		};
	},
	( dispatch ) => ( {
		onInsertBlock( name, position ) {
			dispatch( hideInsertionPoint() );
			dispatch( insertBlock(
				createBlock( name ),
				position
			) );
		},
	} )
)( Inserter );
