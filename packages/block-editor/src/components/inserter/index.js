/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { Component } from '@wordpress/element';
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
import { getAppenderLabel } from './get-appender-label';

const defaultRenderToggle = ( {
	onToggle,
	disabled,
	isOpen,
	blockTitle,
	hasSingleBlockType,
	appenderLabel,
	toggleProps = {},
} ) => {
	const {
		as: Wrapper = Button,
		label: labelProp,
		onClick,
		...rest
	} = toggleProps;

	let label = labelProp;
	if ( ! label && appenderLabel ) {
		// Block returns the full label; use directly (consistent with getBlockLabel).
		label = appenderLabel;
	} else if ( ! label && hasSingleBlockType ) {
		label = sprintf(
			// translators: %s: the name of the block when there is only one
			_x( 'Add %s', 'directly add the only allowed block' ),
			blockTitle.toLowerCase()
		);
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
			__next40pxDefaultSize={ toggleProps.as ? undefined : true }
			icon={ plus }
			label={ label }
			tooltipPosition="bottom"
			onClick={ handleClick }
			className="block-editor-inserter__toggle"
			aria-haspopup={ ! hasSingleBlockType ? 'true' : false }
			aria-expanded={ ! hasSingleBlockType ? isOpen : false }
			isPressed={ ! hasSingleBlockType && isOpen }
			disabled={ disabled }
			{ ...rest }
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
	 * @return {Element} Dropdown toggle element.
	 */
	renderToggle( { onToggle, isOpen } ) {
		const {
			disabled,
			blockTitle,
			hasSingleBlockType,
			appenderLabel,
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
			appenderLabel,
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
	 * @return {Element} Dropdown content element.
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
			onSelectOrClose,
			selectBlockOnInsert,
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
					selectBlockOnInsert={ selectBlockOnInsert }
				/>
			);
		}

		return (
			<InserterMenu
				onSelect={ () => {
					onClose();
				} }
				onClose={ onClose }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
			/>
		);
	}

	render() {
		const {
			position,
			hasSingleBlockType,
			blockToInsert,
			insertOnlyAllowedBlock,
			__experimentalIsQuick: isQuick,
			onSelectOrClose,
		} = this.props;

		if ( hasSingleBlockType || blockToInsert ) {
			return this.renderToggle( { onToggle: insertOnlyAllowedBlock } );
		}

		return (
			<Dropdown
				className="block-editor-inserter"
				contentClassName={ clsx( 'block-editor-inserter__popover', {
					'is-quick': isQuick,
				} ) }
				popoverProps={ { position, shift: true } }
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

export default compose( [
	withSelect(
		( select, { clientId, rootClientId, shouldDirectInsert = true } ) => {
			const {
				getBlockRootClientId,
				hasInserterItems,
				getAllowedBlocks,
				getDirectInsertBlock,
				getBlockListSettings,
			} = select( blockEditorStore );
			const { getBlockVariations, getBlockType } = select( blocksStore );

			rootClientId =
				rootClientId || getBlockRootClientId( clientId ) || undefined;

			const allowedBlocks = getAllowedBlocks( rootClientId );
			const directInsertBlock =
				shouldDirectInsert && getDirectInsertBlock( rootClientId );
			const { defaultBlock } = getBlockListSettings( rootClientId ) ?? {};

			const hasSingleBlockType =
				allowedBlocks?.length === 1 &&
				getBlockVariations( allowedBlocks[ 0 ].name, 'inserter' )
					?.length === 0;
			const allowedBlockType = hasSingleBlockType
				? allowedBlocks[ 0 ]
				: null;

			// Single-block-type parents get adjacent-attribute copying
			// without needing to set `directInsert: true`.
			let blockToInsert = directInsertBlock || null;
			if (
				! blockToInsert &&
				hasSingleBlockType &&
				defaultBlock?.name === allowedBlockType.name
			) {
				blockToInsert = defaultBlock;
			}

			const defaultBlockType = directInsertBlock
				? getBlockType( directInsertBlock.name )
				: null;
			const appenderLabel = getAppenderLabel(
				directInsertBlock,
				defaultBlockType
			);

			return {
				hasItems: hasInserterItems( rootClientId ),
				hasSingleBlockType,
				blockTitle: allowedBlockType ? allowedBlockType.title : '',
				allowedBlockType,
				blockToInsert,
				appenderLabel,
				rootClientId,
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
					blockToInsert,
					onSelectOrClose,
					selectBlockOnInsert,
				} = ownProps;

				if ( ! hasSingleBlockType && ! blockToInsert ) {
					return;
				}

				const blockName = blockToInsert?.name ?? allowedBlockType.name;

				function getAdjacentBlockAttributes( attributesToCopy ) {
					if ( ! attributesToCopy?.length ) {
						return {};
					}

					const { getBlock, getPreviousBlockClientId } =
						select( blockEditorStore );

					// Find the adjacent block of the same type whose attributes
					// should be copied: previous sibling when inserting next to
					// an existing block, otherwise the last child of the root.
					let adjacentAttributes;
					if ( clientId ) {
						const currentBlock = getBlock( clientId );
						const previousBlock = getBlock(
							getPreviousBlockClientId( clientId )
						);
						if ( currentBlock?.name === previousBlock?.name ) {
							adjacentAttributes = previousBlock?.attributes;
						}
					} else if ( rootClientId ) {
						const lastInnerBlock =
							getBlock( rootClientId )?.innerBlocks?.at( -1 );
						if ( lastInnerBlock?.name === blockName ) {
							adjacentAttributes = lastInnerBlock.attributes;
						}
					}

					if ( ! adjacentAttributes ) {
						return {};
					}

					return Object.fromEntries(
						attributesToCopy
							.filter( ( attr ) => attr in adjacentAttributes )
							.map( ( attr ) => [
								attr,
								adjacentAttributes[ attr ],
							] )
					);
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

				// Attempt to augment the inserted block with attributes from an adjacent block.
				// This ensures styling from nearby blocks is preserved in the newly inserted block.
				// See: https://github.com/WordPress/gutenberg/issues/37904
				const newAttributes = getAdjacentBlockAttributes(
					blockToInsert?.attributesToCopy
				);

				const newBlock = createBlock( blockName, {
					...( blockToInsert?.attributes || {} ),
					...newAttributes,
				} );

				insertBlock(
					newBlock,
					getInsertionIndex(),
					rootClientId,
					selectBlockOnInsert
				);

				if ( onSelectOrClose ) {
					onSelectOrClose( newBlock );
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
] )( Inserter );
