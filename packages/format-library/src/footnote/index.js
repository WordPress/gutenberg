/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';

const name = 'core/footnote';
const title = __( 'Footnote' );

export const footnote = {
	name,
	title,
	tagName: 'data',
	attributes: {
		note: ( element ) =>
			element.innerHTML.replace( /^\[/, '' ).replace( /\]$/, '' ),
	},
	render() {
		return (
			<sup>
				<a className="note-link" href="#placeholder">
					{ '' }
				</a>
			</sup>
		);
	},
	saveFallback( { attributes: { note } } ) {
		return `[${ note }]`;
	},
	edit( { isObjectActive, value, onChange, onFocus } ) {
		function onClick() {
			const newValue = insertObject( value, {
				type: name,
				attributes: {
					note: '',
				},
			} );
			newValue.start = newValue.end - 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<>
				<RichTextToolbarButton
					icon={ formatListNumbered }
					title={ title }
					onClick={ onClick }
					isActive={ isObjectActive }
				/>
			</>
		);
	},
};
