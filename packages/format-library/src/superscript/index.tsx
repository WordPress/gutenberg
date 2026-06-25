import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { superscript as superscriptIcon } from '@wordpress/icons';
import type { RichTextValue } from '@wordpress/rich-text';

const name = 'core/superscript';
const title = __( 'Superscript' );

export interface SuperscriptEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: any ) => void;
	onFocus: () => void;
}
const RichTextToolbarButtonUnsafe =
	RichTextToolbarButton as React.ComponentType< any >;

export const superscript = {
	name,
	title,
	tagName: 'sup',
	className: null,
	edit( { isActive, value, onChange, onFocus }: SuperscriptEditProps ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<RichTextToolbarButtonUnsafe
				icon={ superscriptIcon }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
		);
	},
};
