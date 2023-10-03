/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import BlockToolbar from '../block-toolbar';
import { store as blockEditorStore } from '../../store';
import { useHasAnyBlockControls } from '../block-controls/use-has-block-controls';

function BlockContextualToolbar( { focusOnMount, isFixed, ...props } ) {
	const {
		blockType,
		blockEditingMode,
		lastFocus,
		hasParents,
		showParentSelector,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getLastFocus,
			getSelectedBlockClientIds,
			getBlockEditingMode,
		} = select( blockEditorStore );
		const { getBlockType } = select( blocksStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const _selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const parents = getBlockParents( _selectedBlockClientId );
		const firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( firstParentClientId );
		const parentBlockType = getBlockType( parentBlockName );

		return {
			blockType:
				_selectedBlockClientId &&
				getBlockType( getBlockName( _selectedBlockClientId ) ),
			blockEditingMode: getBlockEditingMode( _selectedBlockClientId ),
			lastFocus: getLastFocus(),
			hasParents: parents.length,
			showParentSelector:
				parentBlockType &&
				getBlockEditingMode( firstParentClientId ) === 'default' &&
				hasBlockSupport(
					parentBlockType,
					'__experimentalParentSelector',
					true
				) &&
				selectedBlockClientIds.length <= 1 &&
				getBlockEditingMode( _selectedBlockClientId ) === 'default',
		};
	}, [] );

	const isToolbarEnabled =
		! blockType ||
		hasBlockSupport( blockType, '__experimentalToolbar', true );
	const hasAnyBlockControls = useHasAnyBlockControls();
	if (
		! isToolbarEnabled ||
		( blockEditingMode !== 'default' && ! hasAnyBlockControls )
	) {
		return null;
	}

	// Shifts the toolbar to make room for the parent block selector.
	const classes = classnames( 'block-editor-block-contextual-toolbar', {
		'has-parent': hasParents && showParentSelector,
		'is-fixed': isFixed,
	} );

	return (
		<NavigableToolbar
			focusOnMount={ focusOnMount }
			className={ classes }
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			variant={ isFixed ? 'unstyled' : undefined }
			onChildrenKeyDown={ ( event ) => {
				if ( event.keyCode === ESCAPE && lastFocus?.current ) {
					event.preventDefault();
					lastFocus.current.focus();
				}
			} }
			{ ...props }
		>
			<BlockToolbar hideDragHandle={ isFixed } />
		</NavigableToolbar>
	);
}

export default BlockContextualToolbar;
