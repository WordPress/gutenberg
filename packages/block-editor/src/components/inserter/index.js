/**
 * External dependencies
 */
import { size } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import QuickInserter from './quick-inserter';

const defaultRenderToggle = ( {
	onToggle,
	disabled,
	isOpen,
	blockTitle,
	hasSingleBlockType,
	toggleProps,
} ) => {
	let label;
	if ( hasSingleBlockType ) {
		label = sprintf(
			// translators: %s: the name of the block when there is only one
			_x( 'Add %s', 'directly add the only allowed block' ),
			blockTitle
		);
	} else {
		label = _x( 'Add block', 'Generic label for block inserter button' );
	}
	return (
		<Button
			icon={ plus }
			label={ label }
			tooltipPosition="bottom"
			onClick={ onToggle }
			className="block-editor-inserter__toggle"
			aria-haspopup={ ! hasSingleBlockType ? 'true' : false }
			aria-expanded={ ! hasSingleBlockType ? isOpen : false }
			disabled={ disabled }
			{ ...toggleProps }
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
			toggleProps,
			hasItems,
			renderToggle = defaultRenderToggle,
		} = this.props;

		return renderToggle( {
			onToggle,
			isOpen,
			disabled: disabled || ! hasItems,
			blockTitle,
			hasSingleBlockType,
			toggleProps,
		} );
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

			// This prop is experimental to give some time for the quick inserter to mature
			// Feel free to make them stable after a few releases.
			__experimentalIsQuick: isQuick,
		} = this.props;

		if ( isQuick ) {
			return (
				<QuickInserter
					rootClientId={ rootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					selectBlockOnInsert={ selectBlockOnInsert }
				/>
			);
		}
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
		const {
			position,
			hasSingleBlockType,
			insertOnlyAllowedBlock,
			__experimentalIsQuick: isQuick,
		} = this.props;

		if ( hasSingleBlockType ) {
			return this.renderToggle( { onToggle: insertOnlyAllowedBlock } );
		}

		return (
			<Dropdown
				className="block-editor-inserter"
				contentClassName={ classnames(
					'block-editor-inserter__popover',
					{ 'is-quick': isQuick }
				) }
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
			getBlockSelectionEnd,
		} = select( 'core/block-editor' );
		const { getBlockVariations } = select( 'core/blocks' );

		rootClientId =
			rootClientId ||
			getBlockRootClientId( clientId || getBlockSelectionEnd() ) ||
			undefined;

		const allowedBlocks = __experimentalGetAllowedBlocks( rootClientId );

		const hasSingleBlockType =
			size( allowedBlocks ) === 1 &&
			size(
				getBlockVariations( allowedBlocks[ 0 ].name, 'inserter' )
			) === 0;

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

				const { insertBlock } = dispatch( 'core/block-editor' );

				const blockToInsert = createBlock( allowedBlockType.name );

				insertBlock(
					blockToInsert,
					getInsertionIndex(),
					rootClientId,
					selectBlockOnInsert
				);

				if ( ! selectBlockOnInsert ) {
					const message = sprintf(
						// translators: %s: the name of the block that has been added
						__( '%s block added' ),
						allowedBlockType.title
					);
					speak( message );
				}
			},
		};
	} ),
	// The global inserter should always be visible, we are using ( ! isAppender && ! rootClientId && ! clientId ) as
	// a way to detect the global Inserter.
	ifCondition(
		( { hasItems, isAppender, rootClientId, clientId } ) =>
			hasItems || ( ! isAppender && ! rootClientId && ! clientId )
	),
] )( Inserter );
