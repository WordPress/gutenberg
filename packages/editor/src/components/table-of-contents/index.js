/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { info } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import TableOfContentsPanel from './panel';

function TableOfContentsToggle( { isOpen, onToggle } ) {
	useShortcut(
		'core/edit-post/toggle-block-navigation',
		useCallback( onToggle, [ onToggle ] ),
		{
			bindGlobal: true,
		}
	);
	const { shortcut, hasBlocks } = useSelect( ( select ) => {
		return {
			shortcut: select(
				'core/keyboard-shortcuts'
			).getShortcutRepresentation(
				'core/edit-post/toggle-block-navigation'
			),

			hasBlocks: !! select( 'core/block-editor' ).getBlockCount(),
		};
	}, [] );

	return (
		<Button
			onClick={ hasBlocks ? onToggle : undefined }
			icon={ info }
			aria-expanded={ isOpen }
			label={ __( 'Content structure' ) }
			tooltipPosition="bottom"
			aria-disabled={ ! hasBlocks }
			shortcut={ shortcut }
		/>
	);
}

function TableOfContents( { hasOutlineItemsDisabled } ) {
	return (
		<Dropdown
			position="bottom right"
			className="table-of-contents"
			contentClassName="table-of-contents__popover"
			renderToggle={ ( props ) => <TableOfContentsToggle { ...props } /> }
			renderContent={ ( { onClose } ) => (
				<TableOfContentsPanel
					onRequestClose={ onClose }
					hasOutlineItemsDisabled={ hasOutlineItemsDisabled }
				/>
			) }
		/>
	);
}

export default TableOfContents;
