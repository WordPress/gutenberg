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

export { default as InserterResultsPortal } from './results-portal';

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
			children,
			onInsertBlock,
			rootClientId,
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
				renderToggle={ ( { onToggle, isOpen } ) => (
					<IconButton
						icon="insert"
						label={ __( 'Add block' ) }
						onClick={ onToggle }
						className="editor-inserter__toggle"
						aria-haspopup="true"
						aria-expanded={ isOpen }
					>
						{ children }
					</IconButton>
				) }
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
	withSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getBlockInsertionPoint,
			getSelectedBlock,
			getInserterItems,
		} = select( 'core/editor' );
		const insertionPoint = getBlockInsertionPoint();
		const { rootClientId } = insertionPoint;
		return {
			title: getEditedPostAttribute( 'title' ),
			insertionPoint,
			selectedBlock: getSelectedBlock(),
			items: getInserterItems( rootClientId ),
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onInsertBlock: ( item ) => {
			const { insertionPoint, selectedBlock } = ownProps;
			const { index, rootClientId, layout } = insertionPoint;
			const { name, initialAttributes } = item;
			const insertedBlock = createBlock( name, { ...initialAttributes, layout } );
			if ( selectedBlock && isUnmodifiedDefaultBlock( selectedBlock ) ) {
				return dispatch( 'core/editor' ).replaceBlocks( selectedBlock.clientId, insertedBlock );
			}
			return dispatch( 'core/editor' ).insertBlock( insertedBlock, index, rootClientId );
		},
	} ) ),
] )( Inserter );
