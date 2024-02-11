/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { formatBold, formatItalic } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import groups from '../block-controls/groups';
import { store as blockEditorStore } from '../../store';

const formats = [
	{
		name: 'core/bold',
		shortcutType: 'primary',
		shortcut: 'b',
		icon: formatBold,
		title: __( 'Bold' ),
	},
	{
		name: 'core/italic',
		shortcutType: 'primary',
		shortcut: 'i',
		icon: formatItalic,
		title: __( 'Italic' ),
	},
];

export function useRichTextTools() {
	const registry = useRegistry();
	const hasMultiSelection = useSelect( ( select ) =>
		select( blockEditorStore ).hasMultiSelection()
	);
	const {
		getSelectionStart,
		getSelectionEnd,
		getBlockAttributes,
		getSelectedBlockClientIds,
	} = useSelect( blockEditorStore );
	const { updateBlock } = useDispatch( blockEditorStore );
	if ( ! hasMultiSelection ) {
		return {};
	}
	function apply( name ) {
		registry.batch( () => {
			let selectionstart = getSelectionStart();
			let selectionend = getSelectionEnd();
			const clientIds = getSelectedBlockClientIds();
			const { attributeKey } = selectionstart;
			const isReverse = clientIds[ 0 ] === selectionend.clientId;
			if ( isReverse ) {
				selectionstart = selectionend;
				selectionend = getSelectionStart();
			}
			clientIds.forEach( ( clientId ) => {
				const attributes = getBlockAttributes( clientId );
				const attribute = attributes[ attributeKey ];

				let start = 0;
				let end = attribute.length;

				if ( selectionstart.clientId === clientId ) {
					start = selectionstart.offset;
				}
				if ( selectionend.clientId === clientId ) {
					end = selectionend.offset;
				}

				updateBlock( clientId, {
					attributes: {
						[ attributeKey ]: attribute.toggleFormat(
							{ type: name },
							start,
							end
						),
					},
				} );
			} );
		} );
	}
	return {
		onKeyDown: ( event ) => {
			formats.forEach( ( { name, shortcutType, shortcut } ) => {
				if ( isKeyboardEvent[ shortcutType ]( event, shortcut ) ) {
					apply( name );
					event.preventDefault();
				}
			} );
		},
		children: (
			<groups.inline.Fill>
				{ formats.map(
					( { name, shortcutType, shortcut, icon, title } ) => (
						<ToolbarButton
							key={ name }
							name={ name }
							icon={ icon }
							title={ title }
							shortcut={
								shortcutType && shortcut
									? displayShortcut[ shortcutType ](
											shortcut
									  )
									: undefined
							}
							onClick={ ( event ) => {
								apply( name );
								event.preventDefault();
							} }
						/>
					)
				) }
			</groups.inline.Fill>
		),
	};
}
