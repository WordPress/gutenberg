/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import {
	getBlockType,
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
} from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Returns true if the user is using windows.
 *
 * @return {boolean} Whether the user is using Windows.
 */
function isWindows() {
	return window.navigator.platform.indexOf( 'Win' ) > -1;
}

/**
 * Block selection button component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string} props          Component props.
 * @param {string} props.clientId Client ID of block.
 *
 * @return {WPComponent} The component to be rendered.
 */
function BlockSelectionButton( { clientId, rootClientId, ...props } ) {
	const selected = useSelect(
		( select ) => {
			const {
				__unstableGetBlockWithoutInnerBlocks,
				getBlockIndex,
				hasBlockMovingClientId,
				getBlockListSettings,
			} = select( 'core/block-editor' );
			const index = getBlockIndex( clientId, rootClientId );
			const { name, attributes } = __unstableGetBlockWithoutInnerBlocks(
				clientId
			);
			const blockMovingMode = hasBlockMovingClientId();
			return {
				index,
				name,
				attributes,
				blockMovingMode,
				orientation: getBlockListSettings( rootClientId )?.orientation,
			};
		},
		[ clientId, rootClientId ]
	);
	const { index, name, attributes, blockMovingMode, orientation } = selected;
	const { setNavigationMode, removeBlock } = useDispatch(
		'core/block-editor'
	);
	const ref = useRef();

	// Focus the breadcrumb in navigation mode.
	useEffect( () => {
		ref.current.focus();

		// NVDA on windows suffers from a bug where focus changes are not announced properly
		// See WordPress/gutenberg#24121 and nvaccess/nvda#5825 for more details
		// To solve it we announce the focus change manually.
		if ( isWindows() ) {
			speak( label );
		}
	}, [] );

	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( keyCode === BACKSPACE || keyCode === DELETE ) {
			removeBlock( clientId );
			event.preventDefault();
		}
	}

	const blockType = getBlockType( name );
	const label = getAccessibleBlockLabel(
		blockType,
		attributes,
		index + 1,
		orientation
	);

	const classNames = classnames(
		'block-editor-block-list__block-selection-button',
		{
			'is-block-moving-mode': !! blockMovingMode,
		}
	);

	return (
		<div className={ classNames } { ...props }>
			<Button
				ref={ ref }
				onClick={ () => setNavigationMode( false ) }
				onKeyDown={ onKeyDown }
				label={ label }
			>
				<BlockTitle clientId={ clientId } />
			</Button>
		</div>
	);
}

export default BlockSelectionButton;
