/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { __unstableRichTextInputEvent } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';

const name = 'core/underline';

export const underline = {
	name,
	title: __( 'Underline' ),
	tagName: 'span',
	className: null,
	attributes: {
		style: 'style',
	},
	edit: function Edit( { value, onChange } ) {
		const onToggle = () => {
			onChange(
				toggleFormat( value, {
					type: name,
					attributes: {
						style: 'text-decoration: underline;',
					},
				} )
			);
		};

		const { registerShortcut } = useDispatch( keyboardShortcutsStore );

		useShortcut( name, ( event ) => {
			onToggle();
			event.preventDefault();
		} );
		useEffect( () => {
			registerShortcut( {
				name,
				category: 'text',
				description: __( 'Make the selected text italic.' ),
				keyCombination: {
					modifier: 'primary',
					character: 'u',
				},
			} );
		}, [ registerShortcut ] );

		return (
			<__unstableRichTextInputEvent
				inputType="formatUnderline"
				onInput={ onToggle }
			/>
		);
	},
};
