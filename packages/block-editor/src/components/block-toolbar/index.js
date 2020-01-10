/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Toolbar } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */

import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockMover from '../block-mover';
import Inserter from '../inserter';

export default function BlockToolbar( { hasMovers = true } ) {
	const {
		blockClientIds,
		isValid,
		mode,
		rootClientId,
		moverDirection,
	} = useSelect( ( select ) => {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockListSettings,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const blockRootClientId = getBlockRootClientId( selectedBlockClientIds[ 0 ] );

		const {
			__experimentalMoverDirection,
		} = getBlockListSettings( blockRootClientId ) || {};

		return {
			blockClientIds: selectedBlockClientIds,
			rootClientId: blockRootClientId,
			isValid: selectedBlockClientIds.length === 1 ?
				isBlockValid( selectedBlockClientIds[ 0 ] ) :
				null,
			mode: selectedBlockClientIds.length === 1 ?
				getBlockMode( selectedBlockClientIds[ 0 ] ) :
				null,
			moverDirection: __experimentalMoverDirection,
		};
	}, [] );
	const [ isInserterShown, setIsInserterShown ] = useState( false );

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	function onFocus() {
		setIsInserterShown( true );
	}

	function onBlur() {
		setIsInserterShown( false );
	}

	const inserter = (
		<Toolbar
			onFocus={ onFocus }
			onBlur={ onBlur }
			// While ideally it would be enough to capture the
			// bubbling focus event from the Inserter, due to the
			// characteristics of click focusing of `button`s in
			// Firefox and Safari, it is not reliable.
			//
			// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
			tabIndex={ -1 }
			className={ classnames(
				'block-editor-block-toolbar__inserter',
				{ 'is-visible': isInserterShown }
			) }
		>
			<Inserter clientId={ blockClientIds[ 0 ] } rootClientId={ rootClientId } />
		</Toolbar>
	);

	if ( blockClientIds.length > 1 ) {
		return (
			<div className="block-editor-block-toolbar">
				{ hasMovers && ( <BlockMover
					clientIds={ blockClientIds }
					__experimentalOrientation={ moverDirection }
				/> ) }
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
				{ inserter }
			</div>
		);
	}

	return (
		<div className="block-editor-block-toolbar">
			{ hasMovers && ( <BlockMover
				clientIds={ blockClientIds }
				__experimentalOrientation={ moverDirection }
			/> ) }
			{ mode === 'visual' && isValid && (
				<>
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
					<BlockFormatControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
			{ inserter }
		</div>
	);
}
