import { __ } from '@wordpress/i18n';
import { insert } from '@wordpress/rich-text';
// @ts-expect-error Block Editor not fully typed yet.
import { RichTextShortcut } from '@wordpress/block-editor';
import type { NonBreakingSpaceEditProps } from '../types';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );

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
