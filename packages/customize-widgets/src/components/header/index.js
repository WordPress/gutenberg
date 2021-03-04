/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem } from '@wordpress/components';
import { BlockToolbar, NavigableToolbar } from '@wordpress/block-editor';
import { PinnedItems } from '@wordpress/interface';
import { plus } from '@wordpress/icons';

/**
 * External dependencies
 */
import { DialogDisclosure } from 'reakit/Dialog';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

const DialogDisclosureButton = forwardRef( ( props, ref ) => (
	<DialogDisclosure as={ Button } { ...props } ref={ ref } />
) );

function Header( { inserter } ) {
	return (
		<>
			<div className="customize-widgets-header">
				<div className="customize-widgets-header__navigable-toolbar-wrapper">
					<NavigableToolbar
						className="customize-widgets-header-toolbar"
						aria-label={ __( 'Document tools' ) }
					>
						<ToolbarItem
							as={ DialogDisclosureButton }
							className="customize-widgets-header-toolbar__inserter-toggle"
							isPressed={ inserter.visible }
							isPrimary
							icon={ plus }
							/* translators: button label text should, if possible, be under 16
					characters. */
							label={ _x(
								'Add block',
								'Generic label for block inserter button'
							) }
							{ ...inserter }
						/>
					</NavigableToolbar>
				</div>
				<div className="edit-widgets-header__actions">
					<PinnedItems.Slot scope="core/edit-widgets" />
				</div>
			</div>
			<div className="edit-widgets-header__block-toolbar">
				<BlockToolbar hideDragHandle />
			</div>

			<Inserter { ...inserter } />
		</>
	);
}

export default Header;
