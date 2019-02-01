/**
 * External dependencies
 */
import classnames from 'classnames';
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { Toolbar, Dropdown, NavigableMenu, MenuItem } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { shortcuts } from '../global-keyboard-shortcuts/visual-editor-shortcuts';
import BlockActions from '../block-actions';
import BlockModeToggle from './block-mode-toggle';
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlockDeleteButton from './reusable-block-delete-button';
import BlockHTMLConvertButton from './block-html-convert-button';
import BlockUnknownConvertButton from './block-unknown-convert-button';
import _BlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import _BlockSettingsMenuPluginsExtension from './block-settings-menu-plugins-extension';

export function BlockSettingsMenu( { clientIds, onSelect } ) {
	const blockClientIds = castArray( clientIds );
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];

	return (
		<BlockActions clientIds={ clientIds }>
			{ ( { onDuplicate, onRemove, onInsertAfter, onInsertBefore, canDuplicate, isLocked } ) => (
				<Dropdown
					contentClassName="editor-block-settings-menu__popover"
					position="bottom right"
					renderToggle={ ( { onToggle, isOpen } ) => {
						const toggleClassname = classnames( 'editor-block-settings-menu__toggle', {
							'is-opened': isOpen,
						} );
						const label = isOpen ? __( 'Hide options' ) : __( 'More options' );

						return (
							<Toolbar controls={ [ {
								icon: 'ellipsis',
								title: label,
								onClick: () => {
									if ( count === 1 ) {
										onSelect( firstBlockClientId );
									}
									onToggle();
								},
								className: toggleClassname,
								extraProps: { 'aria-expanded': isOpen },
							} ] } />
						);
					} }
					renderContent={ ( { onClose } ) => (
						<NavigableMenu className="editor-block-settings-menu__content">
							<_BlockSettingsMenuFirstItem.Slot fillProps={ { onClose } } />
							{ count === 1 && (
								<BlockUnknownConvertButton
									clientId={ firstBlockClientId }
								/>
							) }
							{ count === 1 && (
								<BlockHTMLConvertButton
									clientId={ firstBlockClientId }
								/>
							) }
							{ ! isLocked && canDuplicate && (
								<MenuItem
									className="editor-block-settings-menu__control"
									onClick={ onDuplicate }
									icon="admin-page"
									shortcut={ shortcuts.duplicate.display }
								>
									{ __( 'Duplicate' ) }
								</MenuItem>
							) }
							{ ! isLocked && (
								<Fragment>
									<MenuItem
										className="editor-block-settings-menu__control"
										onClick={ onInsertBefore }
										icon="insert-before"
										shortcut={ shortcuts.insertBefore.display }
									>
										{ __( 'Insert Before' ) }
									</MenuItem>
									<MenuItem
										className="editor-block-settings-menu__control"
										onClick={ onInsertAfter }
										icon="insert-after"
										shortcut={ shortcuts.insertAfter.display }
									>
										{ __( 'Insert After' ) }
									</MenuItem>
								</Fragment>
							) }
							{ count === 1 && (
								<BlockModeToggle
									clientId={ firstBlockClientId }
									onToggle={ onClose }
								/>
							) }
							<ReusableBlockConvertButton
								clientIds={ clientIds }
								onToggle={ onClose }
							/>
							<_BlockSettingsMenuPluginsExtension.Slot fillProps={ { clientIds, onClose } } />
							<div className="editor-block-settings-menu__separator" />
							{ count === 1 && (
								<ReusableBlockDeleteButton
									clientId={ firstBlockClientId }
									onToggle={ onClose }
								/>
							) }
							{ ! isLocked && (
								<MenuItem
									className="editor-block-settings-menu__control"
									onClick={ onRemove }
									icon="trash"
									shortcut={ shortcuts.removeBlock.display }
								>
									{ __( 'Remove Block' ) }
								</MenuItem>
							) }
						</NavigableMenu>
					) }
				/>
			) }
		</BlockActions>
	);
}

export default withDispatch( ( dispatch ) => {
	const { selectBlock } = dispatch( 'core/editor' );

	return {
		onSelect( clientId ) {
			selectBlock( clientId );
		},
	};
} )( BlockSettingsMenu );
