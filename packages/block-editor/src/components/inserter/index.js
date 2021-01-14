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
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';

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
	toggleProps = {},
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

	const { onClick, ...rest } = toggleProps;

	// Handle both onClick functions from the toggle and the parent component
	function handleClick( event ) {
		if ( onToggle ) {
			onToggle( event );
		}
		if ( onClick ) {
			onClick( event );
		}
	}

	return (
		<Button
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

function Inserter( {
	onToggle,
	disabled,
	toggleProps,
	position,
	clientId,
	isAppender,
	showInserterHelpPanel,
	renderToggle = defaultRenderToggle,
	__experimentalSelectBlockOnInsert: selectBlockOnInsert,
	// This prop is experimental to give some time for the quick inserter to mature
	// Feel free to make them stable after a few releases.
	__experimentalIsQuick: isQuick,
	...props
} ) {
	const { insertBlock } = useDispatch( 'core/block-editor' );

	const {
		hasItems,
		hasSingleBlockType,
		blockTitle,
		allowedBlockType,
		rootClientId,
	} = useSelect( ( select ) => {
		const {
			getBlockRootClientId,
			hasInserterItems,
			__experimentalGetAllowedBlocks: getAllowedBlocks,
		} = select( 'core/block-editor' );
		const { getBlockVariations } = select( blocksStore );

		const _rootClientId =
			props.rootClientId || getBlockRootClientId( clientId ) || undefined;

		const allowedBlocks = getAllowedBlocks( _rootClientId );

		const inserterBlockVariations = getBlockVariations(
			allowedBlocks?.length && allowedBlocks[ 0 ].name,
			'inserter'
		);

		const isSingleBlockType =
			allowedBlocks?.length === 1 && ! inserterBlockVariations?.length;

		return {
			hasItems: hasInserterItems( rootClientId ),
			hasSingleBlockType: isSingleBlockType,
			blockTitle: allowedBlockType?.title ?? '',
			allowedBlockType: isSingleBlockType && allowedBlocks[ 0 ],
			rootClientId: _rootClientId,
		};
	} );

	const {
		getBlockIndex,
		getBlockSelectionEnd,
		getBlockOrder,
	} = useSelect( ( select ) => select( 'core/block-editor' ) );

	// The global inserter should always be visible.
	// We are using(!isAppender && !rootClientId && !clientId) as
	// a way to detect the global Inserter.
	if ( ! ( hasItems || ( ! isAppender && ! rootClientId && ! clientId ) ) ) {
		return null;
	}

	function insertOnlyAllowedBlock() {
		if ( ! hasSingleBlockType ) {
			return;
		}

		const blockToInsert = createBlock( allowedBlockType.name );

		function getInsertionIndex() {
			if ( clientId ) {
				return getBlockIndex( clientId, rootClientId );
			}

			const end = getBlockSelectionEnd();

			if ( ! isAppender && end ) {
				return getBlockIndex( end, rootClientId ) + 1;
			}

			return getBlockOrder( rootClientId ).length;
		}

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
	}

	if ( hasSingleBlockType ) {
		return renderToggle( {
			onToggle: insertOnlyAllowedBlock,
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
	function renderContent( { onClose } ) {
		const inserterProps = {
			onSelect: onClose,
			rootClientId,
			clientId,
			isAppender,
		};

		if ( isQuick ) {
			return (
				<QuickInserter
					{ ...inserterProps }
					selectBlockOnInsert={ selectBlockOnInsert }
				/>
			);
		}

		return (
			<InserterMenu
				{ ...inserterProps }
				showInserterHelpPanel={ showInserterHelpPanel }
				__experimentalSelectBlockOnInsert={ selectBlockOnInsert }
			/>
		);
	}

	const contentClassName = classnames( 'block-editor-inserter__popover', {
		'is-quick': isQuick,
	} );

	return (
		<Dropdown
			className="block-editor-inserter"
			expandOnMobile
			headerTitle={ __( 'Add a block' ) }
			{ ...{
				contentClassName,
				position,
				onToggle,
				renderToggle,
				renderContent,
			} }
		/>
	);
}

export default Inserter;
