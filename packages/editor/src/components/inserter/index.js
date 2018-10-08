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
	withSelect( ( select, { rootClientId, layout } ) => {
		const {
			getEditedPostAttribute,
			getBlockInsertionPoint,
			getSelectedBlock,
			getInserterItems,
			getBlockOrder,
		} = select( 'core/editor' );
		const insertionPoint = getBlockInsertionPoint();
		const parentId = rootClientId || insertionPoint.rootClientId;
		return {
			title: getEditedPostAttribute( 'title' ),
			insertionPoint: {
				rootClientId: parentId,
				layout: rootClientId ? layout : insertionPoint.layout,
				index: rootClientId ? getBlockOrder( rootClientId ).length : insertionPoint.index,
			},
			selectedBlock: getSelectedBlock(),
			items: getInserterItems( parentId ),
			rootClientId: parentId,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onInsertBlock: ( item ) => {
			const { selectedBlock, insertionPoint } = ownProps;
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
