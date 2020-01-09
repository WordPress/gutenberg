/**
 * External dependencies
 */
import { get } from 'lodash';
/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import {
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

const defaultRenderToggle = ( { onToggle, disabled, isOpen, blockTitle, hasSingleBlockType } ) => {
	let label;
	if ( hasSingleBlockType ) {
		// translators: %s: the name of the block when there is only one
		label = sprintf( _x( 'Add %s', 'directly add the only allowed block' ), blockTitle );
	} else {
		label = _x( 'Add block', 'Generic label for block inserter button' );
	}
	return (
		<Button
			icon="insert"
			label={ label }
			tooltipPosition="bottom"
			onClick={ onToggle }
			className="block-editor-inserter__toggle"
			aria-haspopup={ ! hasSingleBlockType ? 'true' : false }
			aria-expanded={ ! hasSingleBlockType ? isOpen : false }
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
			hasSingleBlockType,
			renderToggle = defaultRenderToggle,
		} = this.props;

		return renderToggle( { onToggle, isOpen, disabled, blockTitle, hasSingleBlockType } );
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
		const {
			rootClientId,
			clientId,
			isAppender,
			showInserterHelpPanel,
			__experimentalSelectBlockOnInsert: selectBlockOnInsert,
		} = this.props;

		return (
			<InserterMenu
				onSelect={ onClose }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
				__experimentalSelectBlockOnInsert={ selectBlockOnInsert }
			/>
		);
	}

	render() {
		const { position, hasSingleBlockType, insertOnlyAllowedBlock } = this.props;

		if ( hasSingleBlockType ) {
			return this.renderToggle( { onToggle: insertOnlyAllowedBlock } );
		}

		return (
			<Dropdown
				className="block-editor-inserter"
				contentClassName="block-editor-inserter__popover"
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
	withSelect( ( select, { clientId, rootClientId } ) => {
		const {
			getBlockRootClientId,
			hasInserterItems,
			__experimentalGetAllowedBlocks,
		} = select( 'core/block-editor' );

		rootClientId = rootClientId || getBlockRootClientId( clientId ) || undefined;

		const allowedBlocks = __experimentalGetAllowedBlocks( rootClientId );

		const hasSingleBlockType = allowedBlocks && ( get( allowedBlocks, [ 'length' ], 0 ) === 1 );

		let allowedBlockType = false;
		if ( hasSingleBlockType ) {
			allowedBlockType = allowedBlocks[ 0 ];
		}

		return {
			hasItems: hasInserterItems( rootClientId ),
			hasSingleBlockType,
			blockTitle: allowedBlockType ? allowedBlockType.title : '',
			allowedBlockType,
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		return {
			insertOnlyAllowedBlock() {
				const { rootClientId, clientId, isAppender } = ownProps;
				const {
					hasSingleBlockType,
					allowedBlockType,
					__experimentalSelectBlockOnInsert: selectBlockOnInsert,
				} = ownProps;

				if ( ! hasSingleBlockType ) {
					return;
				}

				function getInsertionIndex() {
					const {
						getBlockIndex,
						getBlockSelectionEnd,
						getBlockOrder,
					} = select( 'core/block-editor' );

					// If the clientId is defined, we insert at the position of the block.
					if ( clientId ) {
						return getBlockIndex( clientId, rootClientId );
					}

					// If there a selected block, we insert after the selected block.
					const end = getBlockSelectionEnd();
					if ( ! isAppender && end ) {
						return getBlockIndex( end, rootClientId ) + 1;
					}

					// Otherwise, we insert at the end of the current rootClientId
					return getBlockOrder( rootClientId ).length;
				}

				const {
					insertBlock,
				} = dispatch( 'core/block-editor' );

				const blockToInsert = createBlock( allowedBlockType.name );

				insertBlock(
					blockToInsert,
					getInsertionIndex(),
					rootClientId,
					selectBlockOnInsert
				);

				if ( ! selectBlockOnInsert ) {
					// translators: %s: the name of the block that has been added
					const message = sprintf( __( '%s block added' ), allowedBlockType.title );
					speak( message );
				}
			},
		};
	} ),
	ifCondition( ( { hasItems } ) => hasItems ),
] )( Inserter );
