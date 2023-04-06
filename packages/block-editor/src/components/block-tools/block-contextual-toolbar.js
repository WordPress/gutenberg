/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { ToolbarItem, Button } from '@wordpress/components';
import { levelUp } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import BlockToolbar from '../block-toolbar';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

const CollapseFixedToolbarButton = forwardRef( ( { onClick }, ref ) => {
	return (
		<ToolbarItem
			as={ Button }
			className="components-button components-toolbar-button block-editor-block-toolbar__collapse-fixed-toolbar"
			icon={ levelUp }
			onClick={ onClick }
			ref={ ref }
			label={ __( 'Collapse Block Tools' ) }
		/>
	);
} );

const ExpandFixedToolbarButton = forwardRef( ( { onClick, icon }, ref ) => {
	return (
		<ToolbarItem
			as={ Button }
			className="components-button components-toolbar-button block-editor-block-toolbar__expand-fixed-toolbar"
			icon={ <BlockIcon icon={ icon } /> }
			onClick={ onClick }
			ref={ ref }
			label={ __( 'Expand Block Tools' ) }
		/>
	);
} );

function BlockContextualToolbar( { focusOnMount, isFixed, ...props } ) {
	// When the toolbar is fixed it can be collapsed
	const [ isCollapsed, setIsCollapsed ] = useState( null );
	const expandFixedToolbarButtonRef = useRef();
	const collapseFixedToolbarButtonRef = useRef();

	useEffect( () => {
		if ( isCollapsed && expandFixedToolbarButtonRef.current ) {
			expandFixedToolbarButtonRef.current.focus();
		}
		if ( ! isCollapsed && collapseFixedToolbarButtonRef.current ) {
			collapseFixedToolbarButtonRef.current.focus();
		}
	}, [ isCollapsed ] );

	const { blockType, hasParents, showParentSelector } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockParents,
				getSelectedBlockClientIds,
				__unstableGetContentLockingParent,
			} = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const selectedBlockClientIds = getSelectedBlockClientIds();
			const selectedBlockClientId = selectedBlockClientIds[ 0 ];
			const parents = getBlockParents( selectedBlockClientId );
			const firstParentClientId = parents[ parents.length - 1 ];
			const parentBlockName = getBlockName( firstParentClientId );
			const parentBlockType = getBlockType( parentBlockName );

			return {
				blockType:
					selectedBlockClientId &&
					getBlockType( getBlockName( selectedBlockClientId ) ),
				hasParents: parents.length,
				showParentSelector:
					parentBlockType &&
					hasBlockSupport(
						parentBlockType,
						'__experimentalParentSelector',
						true
					) &&
					selectedBlockClientIds.length <= 1 &&
					! __unstableGetContentLockingParent(
						selectedBlockClientId
					),
			};
		},
		[]
	);

	const isLargeViewport = useViewportMatch( 'medium' );

	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	// Shifts the toolbar to make room for the parent block selector.
	const classes = classnames( 'block-editor-block-contextual-toolbar', {
		'has-parent': hasParents && showParentSelector,
		'is-fixed': isFixed,
		'is-collapsed': isCollapsed,
	} );

	return (
		<NavigableToolbar
			focusOnMount={ focusOnMount }
			className={ classes }
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			{ ...props }
		>
			{ isFixed && isLargeViewport && blockType && (
				<>
					{ isCollapsed ? (
						<ExpandFixedToolbarButton
							onClick={ () => setIsCollapsed( false ) }
							icon={ blockType.icon }
							ref={ expandFixedToolbarButtonRef }
						/>
					) : (
						<CollapseFixedToolbarButton
							onClick={ () => setIsCollapsed( true ) }
							ref={ collapseFixedToolbarButtonRef }
						/>
					) }
				</>
			) }
			{ ! isCollapsed && <BlockToolbar hideDragHandle={ isFixed } /> }
		</NavigableToolbar>
	);
}

export default BlockContextualToolbar;
