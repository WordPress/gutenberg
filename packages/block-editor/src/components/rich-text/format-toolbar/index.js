/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Toolbar,
	Slot,
	Dropdown,
	Button,
	NavigableMenu,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { DOWN } from '@wordpress/keycodes';
import { chevronDown } from '@wordpress/icons';

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

const FormatToolbar = () => {
	const slot = useSlot( 'RichText.ToolbarControls' );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	return (
		<div className="block-editor-format-toolbar">
			<Toolbar>
				{ [ 'bold', 'italic', 'link', 'text-color' ].map(
					( format ) => (
						<Slot
							name={ `RichText.ToolbarControls.${ format }` }
							key={ format }
							bubblesVirtually
						/>
					)
				) }
				{ hasFills && (
					<Dropdown
						popoverProps={ POPOVER_PROPS }
						renderToggle={ ( { isOpen, onToggle } ) => {
							const openOnArrowDown = ( event ) => {
								if ( ! isOpen && event.keyCode === DOWN ) {
									event.preventDefault();
									event.stopPropagation();
									onToggle();
								}
							};

							return (
								<Button
									icon={ chevronDown }
									onClick={ onToggle }
									onKeyDown={ openOnArrowDown }
									aria-haspopup="true"
									aria-expanded={ isOpen }
									label={ __( 'More rich text controls' ) }
									showTooltip
								/>
							);
						} }
						renderContent={ ( { onClose } ) => (
							<NavigableMenu
								aria-label={ __( 'More rich text controls' ) }
								role="menu"
							>
								<Slot
									name="RichText.ToolbarControls"
									bubblesVirtually
									fillProps={ { onClose } }
								/>
							</NavigableMenu>
						) }
					/>
				) }
			</Toolbar>
		</div>
	);
};

export default FormatToolbar;
