import { __ } from '@wordpress/i18n';
import type { RichTextValue } from '@wordpress/rich-text';
import { insert } from '@wordpress/rich-text';
import { RichTextShortcut } from '@wordpress/block-editor';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );

interface NonBreakingSpaceEditProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
}

export const nonBreakingSpace = {
	name,
	title,
	tagName: 'nbsp',
	className: null,
	edit( { value, onChange }: NonBreakingSpaceEditProps ) {
		function addNonBreakingSpace() {
			onChange( insert( value, '\u00a0' ) );
		}

		return (
			<RichTextShortcut
				type="primaryShift"
				character=" "
				onUse={ addNonBreakingSpace }
			/>
		);
	},
};
