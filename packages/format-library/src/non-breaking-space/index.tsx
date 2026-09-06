import { __ } from '@wordpress/i18n';
import { applyFormat, insert, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
// @ts-expect-error Block Editor not fully typed yet.
import { RichTextShortcut } from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import type {
	NonBreakingSpaceEditProps,
	NonBreakingSpacePopoverAnchorProps,
} from '../types';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );

function PopoverAnchor( { contentRef }: NonBreakingSpacePopoverAnchorProps ) {
	const popoverAnchor = useAnchor( {
		// eslint-disable-next-line react-hooks/refs
		editableContentElement: contentRef.current,
		settings: nonBreakingSpace,
	} );

	return (
		<Popover anchor={ popoverAnchor }>
			<div style={ { whiteSpace: 'nowrap', padding: '4px' } }>
				{ __( 'Non-breaking space' ) }
			</div>
		</Popover>
	);
}

export const nonBreakingSpace = {
	name,
	title,
	tagName: 'span',
	className: 'non-breaking-space',
	edit( { value, onChange, contentRef }: NonBreakingSpaceEditProps ) {
		function addNonBreakingSpace() {
			onChange( insert( value, '\u00a0' ) );
		}

		const selectedValue =
			value.start && value.end
				? value.text.slice( value.start, value.end )
				: null;

		return (
			<>
				<RichTextShortcut
					type="primaryShift"
					character=" "
					onUse={ addNonBreakingSpace }
				/>
				{ selectedValue === '\u00a0' && (
					<PopoverAnchor contentRef={ contentRef } />
				) }
			</>
		);
	},
	__experimentalCreatePrepareEditableTree(): (
		formats: RichTextValue[ 'formats' ],
		text: string
	) => RichTextValue[ 'formats' ] {
		return ( formats, text ) => {
			const NBSP = '\u00a0';
			// Not a complete `RichTextValue`: the callback only receives
			// `formats` and `text`. The assertion is safe because `applyFormat`
			// is passed explicit indices (so it never falls back to `start`/
			// `end`), reads only `formats`, and spreads the rest through
			// untouched — and only `formats` is read back out below.
			let record = { formats, text } as RichTextValue;
			let index = -1;

			do {
				index = text.indexOf( NBSP, index + 1 );
				if ( index !== -1 ) {
					record = applyFormat(
						record,
						{ type: name },
						index,
						index + 1
					);
				}
			} while ( index !== -1 );

			return record.formats;
		};
	},
};
