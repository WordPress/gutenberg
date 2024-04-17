/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockToolbar,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { useHasBlockToolbar } = unlock( blockEditorPrivateApis );

function ContextualToolbar( {
	blockSelectionStart,
	isCollapsed,
	toggleCollapse,
} ) {
	const blockToolbarRef = useRef();
	const hasBlockToolbar = useHasBlockToolbar();

	const hasBlockSelection = !! blockSelectionStart;

	useEffect( () => {
		// If we have a new block selection, show the block tools
		if ( blockSelectionStart ) {
			toggleCollapse( false );
		}
	}, [ blockSelectionStart, toggleCollapse ] );

	if ( ! hasBlockToolbar ) {
		return null;
	}

	return (
		<>
			<div
				className={ classnames( 'selected-block-tools-wrapper', {
					'is-collapsed': isCollapsed || ! hasBlockSelection,
				} ) }
			>
				<BlockToolbar hideDragHandle />
			</div>
			<Popover.Slot ref={ blockToolbarRef } name="block-toolbar" />

			<Button
				className="edit-post-header__block-tools-toggle"
				icon={ isCollapsed ? next : previous }
				onClick={ () => {
					toggleCollapse( ! isCollapsed );
				} }
				label={
					isCollapsed
						? __( 'Show block tools' )
						: __( 'Hide block tools' )
				}
				size="compact"
			/>
		</>
	);
}

export default ContextualToolbar;
