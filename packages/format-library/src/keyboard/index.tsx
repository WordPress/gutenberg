import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
// @ts-expect-error Block Editor not fully typed yet.
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { button } from '@wordpress/icons';
import type { CodeEditProps } from '../types';

const name = 'core/keyboard';
const title = __( 'Keyboard input' );
const RichTextToolbarButtonUnsafe =
	RichTextToolbarButton as React.ComponentType< any >;

export const keyboard = {
	name,
	title,
	tagName: 'kbd',
	className: null,
	edit( { isActive, value, onChange, onFocus }: CodeEditProps ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<RichTextToolbarButtonUnsafe
				icon={ button }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
		);
	},
};
