/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	DocumentBar,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { useHasBlockToolbar } = unlock( blockEditorPrivateApis );
const { TopBlockToolbar } = unlock( editorPrivateApis );

function ContextualToolbar( { blockSelectionStart, hasHistory } ) {
	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	// TODO: Change this to "isBlockToolbarVisible" or similar
	const hasBlockToolbar = useHasBlockToolbar();
	const hasBlockSelection = !! blockSelectionStart;

	useEffect( () => {
		// If we have a new block selection, show the block tools
		if ( blockSelectionStart ) {
			setIsBlockToolsCollapsed( false );
		}
	}, [ blockSelectionStart ] );

	return (
		<>
			{ hasBlockToolbar && (
				<>
					<TopBlockToolbar
						isCollapsed={
							isBlockToolsCollapsed || ! hasBlockSelection
						}
					/>
					<Button
						className="edit-post-header__block-tools-toggle"
						icon={ isBlockToolsCollapsed ? next : previous }
						onClick={ () => {
							setIsBlockToolsCollapsed(
								( collapsed ) => ! collapsed
							);
						} }
						label={
							isBlockToolsCollapsed
								? __( 'Show block tools' )
								: __( 'Hide block tools' )
						}
						size="compact"
					/>
				</>
			) }
			{ hasHistory && (
				<div
					className={ classnames( 'edit-post-header__center', {
						'is-collapsed': ! isBlockToolsCollapsed,
					} ) }
				>
					<DocumentBar />
				</div>
			) }
		</>
	);
}

export default ContextualToolbar;
