import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
// @ts-expect-error Block Editor not fully typed yet.
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { subscript as subscriptIcon } from '@wordpress/icons';
import type { SubscriptEditProps } from '../types';

const name = 'core/subscript';
const title = __( 'Subscript' );

const RichTextToolbarButtonUnsafe =
	RichTextToolbarButton as React.ComponentType< any >;

export const subscript = {
	name,
	title,
	tagName: 'sub',
	className: null,
	edit( { isActive, value, onChange, onFocus }: SubscriptEditProps ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<RichTextToolbarButtonUnsafe
				icon={ subscriptIcon }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
		);
	},
};
