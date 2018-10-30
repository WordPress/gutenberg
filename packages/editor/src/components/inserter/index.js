/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

const defaultRenderToggle = ( { onToggle, disabled, isOpen } ) => (
	<IconButton
		icon="insert"
		label={ __( 'Add block' ) }
		onClick={ onToggle }
		className="editor-inserter__toggle"
		aria-haspopup="true"
		aria-expanded={ isOpen }
		disabled={ disabled }
	/>
);

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	render() {
		const {
			items,
			position,
			title,
			onInsertBlock,
			rootClientId,
			disabled,
			renderToggle = defaultRenderToggle,
		} = this.props;

		if ( items.length === 0 ) {
			return null;
		}

		return (
			<Dropdown
				className="editor-inserter"
				contentClassName="editor-inserter__popover"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ title }
				renderToggle={ ( { onToggle, isOpen } ) => renderToggle( { onToggle, isOpen, disabled } ) }
				renderContent={ ( { onClose } ) => {
					const onSelect = ( item ) => {
						onInsertBlock( item );

						onClose();
					};

					return (
						<InserterMenu
							items={ items }
							onSelect={ onSelect }
							rootClientId={ rootClientId }
						/>
					);
				} }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getEditedPostAttribute,
			getBlockInsertionPoint,
			getSelectedBlock,
			getInserterItems,
		} = select( 'core/editor' );

		let index;
		if ( rootClientId === undefined ) {
			// Unless explicitly provided, the default insertion point provided
			// by the store occurs immediately following the selected block.
			// Otherwise, the default behavior for an undefined index is to
			// append block to the end of the rootClientId context.
			const insertionPoint = getBlockInsertionPoint();
			( { rootClientId, index } = insertionPoint );
		}

		return {
			title: getEditedPostAttribute( 'title' ),
			selectedBlock: getSelectedBlock(),
			items: getInserterItems( rootClientId ),
			index,
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onInsertBlock: ( item ) => {
			const { selectedBlock, index, rootClientId } = ownProps;
			const { name, initialAttributes } = item;
			const insertedBlock = createBlock( name, initialAttributes );
			if ( selectedBlock && isUnmodifiedDefaultBlock( selectedBlock ) ) {
				return dispatch( 'core/editor' ).replaceBlocks( selectedBlock.clientId, insertedBlock );
			}
			return dispatch( 'core/editor' ).insertBlock( insertedBlock, index, rootClientId );
		},
	} ) ),
] )( Inserter );
