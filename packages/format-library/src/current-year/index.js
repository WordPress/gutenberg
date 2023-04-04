/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';
import { dateI18n } from '@wordpress/date';

const name = 'core/current-year';
const title = __( 'Current Year' );

function Time() {
	const year = dateI18n( 'Y', new Date() );
	return <time dateTime={ year }>{ year }</time>;
}

export const currentYear = {
	name,
	title,
	tagName: 'data',
	render: Time,
	saveFallback: Time,
	edit( { isObjectActive, value, onChange, onFocus } ) {
		function onClick() {
			const newValue = insertObject( value, {
				type: name,
			} );
			newValue.start = newValue.end - 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<RichTextToolbarButton
				icon={ formatListNumbered }
				title={ title }
				onClick={ onClick }
				isActive={ isObjectActive }
			/>
		);
	},
};
