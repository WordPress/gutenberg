import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { subscript as subscriptIcon } from '@wordpress/icons';

const name = 'core/subscript';
const title = __( 'Subscript' );

const RichTextToolbarButtonUnsafe =
	RichTextToolbarButton as React.ComponentType< any >;

export interface SubscriptEditProps {
	isActive: boolean;
	value: any;
	onChange: ( value: any ) => void;
	onFocus: () => void;
}
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
