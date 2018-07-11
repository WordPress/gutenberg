/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSettingsMenu from '../block-settings-menu';
import NavigableToolbar from '../navigable-toolbar';
import BlockSwitcher from '../block-switcher';

function BlockListMultiControls( { multiSelectedBlockUids, rootUID, isSelecting, isFirst, isLast } ) {
	if ( isSelecting ) {
		return null;
	}

	return [
		<NavigableToolbar
			className="editor-block-contextual-toolbar"
			aria-label={ __( 'Block Toolbar' ) }
			key="toolbar"
		>
			<BlockSwitcher uids={ multiSelectedBlockUids } />
		</NavigableToolbar>,
		<BlockMover
			key="mover"
			rootUID={ rootUID }
			uids={ multiSelectedBlockUids }
			isFirst={ isFirst }
			isLast={ isLast }
		/>,
		<BlockSettingsMenu
			key="menu"
			rootUID={ rootUID }
			uids={ multiSelectedBlockUids }
			focus
		/>,
	];
}

export default withSelect( ( select, { rootUID } ) => {
	const {
		getMultiSelectedBlockUids,
		isMultiSelecting,
		getBlockIndex,
		getBlockCount,
	} = select( 'core/editor' );
	const uids = getMultiSelectedBlockUids();
	const firstIndex = getBlockIndex( first( uids ), rootUID );
	const lastIndex = getBlockIndex( last( uids ), rootUID );

	return {
		multiSelectedBlockUids: uids,
		isSelecting: isMultiSelecting(),
		isFirst: firstIndex === 0,
		isLast: lastIndex + 1 === getBlockCount(),
	};
} )( BlockListMultiControls );
