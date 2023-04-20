/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

const name = 'core/lang';
const title = __( 'Language selection' );

function Edit( { isActive, value, onChange, onFocus } ) {
	function onToggle() {
		onChange(
			toggleFormat( value, {
				type: name,
				attributes: {
					lang: 'it',
					dir: 'ltr',
				},
				title,
			} )
		);
	}

	function onClick() {
		onToggle();
		onFocus();
	}

	return (
		<RichTextToolbarButton
			icon={ 'translation' }
			title={ title }
			onClick={ onClick }
			isActive={ isActive }
			role="menuitemcheckbox"
		/>
	);
}

export const lang = {
	name,
	title,
	tagName: 'span',
	className: 'wp-lang',
	edit: Edit,
	attributes: {
		lang: 'lang',
		dir: 'dir',
	},
};
