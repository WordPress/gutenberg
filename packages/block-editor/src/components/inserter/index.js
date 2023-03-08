/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { forwardRef, Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import QuickInserter from './quick-inserter';
import { store as blockEditorStore } from '../../store';

const defaultRenderToggle = ( {
	onToggle,
	disabled,
	isOpen,
	blockTitle,
	hasSingleBlockType,
	toggleProps = {},
	prioritizePatterns,
} ) => {
	const {
		as: Wrapper = Button,
		label: labelProp,
		onClick,
		...rest
	} = toggleProps;

	let label = labelProp;
	if ( ! label && hasSingleBlockType ) {
		label = sprintf(
			// translators: %s: the name of the block when there is only one
			_x( 'Add %s', 'directly add the only allowed block' ),
			blockTitle
		);
	} else if ( ! label && prioritizePatterns ) {
		label = __( 'Add pattern' );
	} else if ( ! label ) {
		label = _x( 'Add block', 'Generic label for block inserter button' );
	}

	// Handle both onClick functions from the toggle and the parent component.
	function handleClick( event ) {
		if ( onToggle ) {
			onToggle( event );
		}
		if ( onClick ) {
			onClick( event );
		}
	}

	return (
		<Wrapper
			icon={ plus }
			label={ label }
			tooltipPosition="bottom"
			onClick={ handleClick }
			className="block-editor-inserter__toggle"
			aria-haspopup={ ! hasSingleBlockType ? 'true' : false }
			aria-expanded={ ! hasSingleBlockType ? isOpen : false }
			disabled={ disabled }
			{ ...rest }
		/>
	);
};

class PrivateInserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderToggle = this.renderToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component.
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
			directInsertBlock,
			toggleProps,
			hasItems,
			renderToggle = defaultRenderToggle,
			prioritizePatterns,
		} = this.props;

		return renderToggle( {
			onToggle,
			isOpen,
			disabled: disabled || ! hasItems,
			blockTitle,
			hasSingleBlockType,
			directInsertBlock,
			toggleProps,
			prioritizePatterns,
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

			// This prop is experimental to give some time for the quick inserter to mature
			// Feel free to make them stable after a few releases.
			__experimentalIsQuick: isQuick,
			prioritizePatterns,
			onSelectOrClose,
			selectBlockOnInsert,
			orderInitialBlockItems,
		} = this.props;

		if ( isQuick ) {
			return (
				<QuickInserter
					onSelect={ ( blocks ) => {
						const firstBlock =
							Array.isArray( blocks ) && blocks?.length
								? blocks[ 0 ]
								: blocks;
						if (
							onSelectOrClose &&
							typeof onSelectOrClose === 'function'
						) {
							onSelectOrClose( firstBlock );
						}
						onClose();
					} }
					rootClientId={ rootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					prioritizePatterns={ prioritizePatterns }
					selectBlockOnInsert={ selectBlockOnInsert }
					orderInitialBlockItems={ orderInitialBlockItems }
				/>
			);
		}

		return (
			<InserterMenu
				onSelect={ () => {
					onClose();
				} }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
				prioritizePatterns={ prioritizePatterns }
			/>
		);
	}

	render() {
		const {
			position,
			hasSingleBlockType,
			directInsertBlock,
			insertOnlyAllowedBlock,
			__experimentalIsQuick: isQuick,
			onSelectOrClose,
		} = this.props;

		if ( hasSingleBlockType || directInsertBlock ) {
			return this.renderToggle( { onToggle: insertOnlyAllowedBlock } );
		}

		return (
			<Dropdown
				className="block-editor-inserter"
				contentClassName={ classnames(
					'block-editor-inserter__popover',
					{ 'is-quick': isQuick }
				) }
				popoverProps={ { position } }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ __( 'Add a block' ) }
				renderToggle={ this.renderToggle }
				renderContent={ this.renderContent }
				onClose={ onSelectOrClose }
			/>
		);
	}
}

export const ComposedPrivateInserter = compose( [
	withSelect(
		( select, { clientId, rootClientId, shouldDirectInsert = true } ) => {
			const {
				getBlockRootClientId,
				hasInserterItems,
				getAllowedBlocks,
				__experimentalGetDirectInsertBlock,
				getSettings,
			} = select( blockEditorStore );

			const { getBlockVariations } = select( blocksStore );

			rootClientId =
				rootClientId || getBlockRootClientId( clientId ) || undefined;

			const allowedBlocks = getAllowedBlocks( rootClientId );

			const directInsertBlock =
				shouldDirectInsert &&
				__experimentalGetDirectInsertBlock( rootClientId );

			const settings = getSettings();

			const hasSingleBlockType =
				allowedBlocks?.length === 1 &&
				getBlockVariations( allowedBlocks[ 0 ].name, 'inserter' )
					?.length === 0;

			let allowedBlockType = false;
			if ( hasSingleBlockType ) {
				allowedBlockType = allowedBlocks[ 0 ];
			}

			return {
				hasItems: hasInserterItems( rootClientId ),
				hasSingleBlockType,
				blockTitle: allowedBlockType ? allowedBlockType.title : '',
				allowedBlockType,
				directInsertBlock,
				rootClientId,
				prioritizePatterns:
					settings.__experimentalPreferPatternsOnRoot &&
					! rootClientId,
			};
		}
	),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		return {
			insertOnlyAllowedBlock() {
				const {
					rootClientId,
					clientId,
					isAppender,
					hasSingleBlockType,
					allowedBlockType,
					directInsertBlock,
					onSelectOrClose,
					selectBlockOnInsert,
				} = ownProps;

				if ( ! hasSingleBlockType && ! directInsertBlock ) {
					return;
				}

				function getAdjacentBlockAttributes( attributesToCopy ) {
					const { getBlock, getPreviousBlockClientId } =
						select( blockEditorStore );

					if (
						! attributesToCopy ||
						( ! clientId && ! rootClientId )
					) {
						return {};
					}

					const result = {};
					let adjacentAttributes = {};

					// If there is no clientId, then attempt to get attributes
					// from the last block within innerBlocks of the root block.
					if ( ! clientId ) {
						const parentBlock = getBlock( rootClientId );

						if ( parentBlock?.innerBlocks?.length ) {
							const lastInnerBlock =
								parentBlock.innerBlocks[
									parentBlock.innerBlocks.length - 1
								];

							if (
								directInsertBlock &&
								directInsertBlock?.name === lastInnerBlock.name
							) {
								adjacentAttributes = lastInnerBlock.attributes;
							}
						}
					} else {
						// Otherwise, attempt to get attributes from the
						// previous block relative to the current clientId.
						const currentBlock = getBlock( clientId );
						const previousBlock = getBlock(
							getPreviousBlockClientId( clientId )
						);

						if ( currentBlock?.name === previousBlock?.name ) {
							adjacentAttributes =
								previousBlock?.attributes || {};
						}
					}

					// Copy over only those attributes flagged to be copied.
					attributesToCopy.forEach( ( attribute ) => {
						if ( adjacentAttributes.hasOwnProperty( attribute ) ) {
							result[ attribute ] =
								adjacentAttributes[ attribute ];
						}
					} );

					return result;
				}

				function getInsertionIndex() {
					const {
						getBlockIndex,
						getBlockSelectionEnd,
						getBlockOrder,
						getBlockRootClientId,
					} = select( blockEditorStore );

					// If the clientId is defined, we insert at the position of the block.
					if ( clientId ) {
						return getBlockIndex( clientId );
					}

					// If there a selected block, we insert after the selected block.
					const end = getBlockSelectionEnd();
					if (
						! isAppender &&
						end &&
						getBlockRootClientId( end ) === rootClientId
					) {
						return getBlockIndex( end ) + 1;
					}

					// Otherwise, we insert at the end of the current rootClientId.
					return getBlockOrder( rootClientId ).length;
				}

				const { insertBlock } = dispatch( blockEditorStore );

				let blockToInsert;

				// Attempt to augment the directInsertBlock with attributes from an adjacent block.
				// This ensures styling from nearby blocks is preserved in the newly inserted block.
				// See: https://github.com/WordPress/gutenberg/issues/37904
				if ( directInsertBlock ) {
					const newAttributes = getAdjacentBlockAttributes(
						directInsertBlock.attributesToCopy
					);

					blockToInsert = createBlock( directInsertBlock.name, {
						...( directInsertBlock.attributes || {} ),
						...newAttributes,
					} );
				} else {
					blockToInsert = createBlock( allowedBlockType.name );
				}

				insertBlock(
					blockToInsert,
					getInsertionIndex(),
					rootClientId,
					selectBlockOnInsert
				);

				if ( onSelectOrClose ) {
					onSelectOrClose( {
						clientId: blockToInsert?.clientId,
					} );
				}

				const message = sprintf(
					// translators: %s: the name of the block that has been added
					__( '%s block added' ),
					allowedBlockType.title
				);
				speak( message );
			},
		};
	} ),
	// The global inserter should always be visible, we are using ( ! isAppender && ! rootClientId && ! clientId ) as
	// a way to detect the global Inserter.
	ifCondition(
		( { hasItems, isAppender, rootClientId, clientId } ) =>
			hasItems || ( ! isAppender && ! rootClientId && ! clientId )
	),
] )( PrivateInserter );

const Inserter = forwardRef( ( props, ref ) => {
	return (
		<ComposedPrivateInserter
			ref={ ref }
			{ ...props }
			orderInitialBlockItems={ undefined }
		/>
	);
} );

export default Inserter;
