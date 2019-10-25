/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import {
	createBlock,
	getBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

const defaultRenderToggle = ( { onToggle, disabled, isOpen, blockTitle, hasOnlyOneAllowedInserterItem } ) => {
	
	// translators: %s: the name of the block when there is only one
	const label = blockTitle === '' ? _x( 'Add block', 'Generic label for block inserter button' ) : sprintf( _x( 'Add %s', 'directly add the only allowed block' ), blockTitle );

	return (
		<IconButton
			icon="insert"
			label={ label }
			labelPosition="bottom"
			onClick={ onToggle }
			className="editor-inserter__toggle block-editor-inserter__toggle"
			aria-haspopup={ ! hasOnlyOneAllowedInserterItem ? "true" : false }
			aria-expanded={ ! hasOnlyOneAllowedInserterItem ? isOpen : false }
			disabled={ disabled }
		/>
	);
};

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderToggle = this.renderToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	/**
	 * Render callback to display Dropdown toggle element.
	 *
	 * @param {Object}   options
	 * @param {Function} options.onToggle Callback to invoke when toggle is
	 *                                    pressed.
	 * @param {boolean}  options.isOpen   Whether dropdown is currently open.
	 *
	 * @return {WPElement} Dropdown toggle element.
	 */
	renderToggle( { onToggle, isOpen } ) {
		const {
			disabled,
			blockTitle,
			insertTheOnlyAllowedItem,
			renderToggle = defaultRenderToggle,
		} = this.props;

		return renderToggle( { onToggle, isOpen, disabled, blockTitle, hasOnlyOneAllowedInserterItem } );
	}

	/**
	 * Render callback to display Dropdown content element.
	 *
	 * @param {Object}   options
	 * @param {Function} options.onClose Callback to invoke when dropdown is
	 *                                   closed.
	 *
	 * @return {WPElement} Dropdown content element.
	 */
	renderContent( { onClose } ) {
		const { rootClientId, clientId, isAppender, showInserterHelpPanel } = this.props;

		return (
			<InserterMenu
				onSelect={ onClose }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
			/>
		);
	}

	render() {
		const { position, hasOnlyOneAllowedInserterItem } = this.props;
		if ( hasOnlyOneAllowedInserterItem ) {
			return this.renderToggle( { onToggle: insertTheOnlyAllowedItem } )
		}
		return (
			<Dropdown
				className="editor-inserter block-editor-inserter"
				contentClassName="editor-inserter__popover block-editor-inserter__popover"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ __( 'Add a block' ) }
				renderToggle={ this.renderToggle }
				renderContent={ this.renderContent }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			hasInserterItems,
			__experimentalHasOnlyOneAllowedBlockType,
			__experimentalGetTheOnlyAllowedBlockType,
		} = select( 'core/block-editor' );
		const allowedBlock = getBlockType( __experimentalGetTheOnlyAllowedBlockType( rootClientId ) );
		return {
			hasItems: hasInserterItems( rootClientId ),
			hasOnlyOneAllowedInserterItem: __experimentalHasOnlyOneAllowedBlockType( rootClientId ),
			blockTitle: allowedBlock ? allowedBlock.title : '',
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		return {
			insertTheOnlyAllowedItem: () => {
				const { rootClientId, clientId, isAppender, destinationRootClientId } = ownProps;
				const {
					__experimentalHasOnlyOneAllowedBlockType,
					__experimentalGetTheOnlyAllowedBlockType,
				} = select( 'core/block-editor' );

				const hasOnlyOneAllowedInserterItem = __experimentalHasOnlyOneAllowedBlockType( rootClientId );

				if ( ! hasOnlyOneAllowedInserterItem ) {
					return false;
				}

				const parentAllowedBlocks = __experimentalGetTheOnlyAllowedBlockType( rootClientId );

				function getInsertionIndex() {
					const {
						getBlockIndex,
						getBlockSelectionEnd,
						getBlockOrder,
					} = select( 'core/block-editor' );

					// If the clientId is defined, we insert at the position of the block.
					if ( clientId ) {
						return getBlockIndex( clientId, destinationRootClientId );
					}

					// If there a selected block, we insert after the selected block.
					const end = getBlockSelectionEnd();
					if ( ! isAppender && end ) {
						return getBlockIndex( end, destinationRootClientId ) + 1;
					}

					// Otherwise, we insert at the end of the current rootClientId
					return getBlockOrder( destinationRootClientId ).length;
				}

				const {
					insertBlock,
				} = dispatch( 'core/block-editor' );
				const insertedBlock = createBlock( parentAllowedBlocks );
				insertBlock(
					insertedBlock,
					getInsertionIndex(),
					rootClientId
				);
			},
		};
	} ),
	ifCondition( ( { hasItems } ) => hasItems ),
] )( Inserter );
