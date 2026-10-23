import { __ } from '@wordpress/i18n';
import { applyFormat, insert, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import {
	RichTextShortcut,
	RichTextToolbarButton,
} from '@wordpress/block-editor';
import { Popover, SVG, Path } from '@wordpress/components';
import type { FormatEditProps } from '../types';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );
const NBSP = '\u00a0';

const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M4.5 9.5H6V14h12V9.5h1.5v6h-15z" />
	</SVG>
);

// The selected text, or the characters on both sides of the caret.
function getNonBreakingSpaceRange( { text, start, end }: RichTextValue ) {
	if ( start === undefined || end === undefined ) {
		return null;
	}

	const from = start === end ? Math.max( start - 1, 0 ) : start;
	const to = start === end ? end + 1 : end;

	return text.slice( from, to ).includes( NBSP ) ? [ from, to ] : null;
}

function PopoverAnchor( {
	contentRef,
}: Pick< FormatEditProps, 'contentRef' > ) {
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
	edit( { value, onChange, onFocus, contentRef }: FormatEditProps ) {
		function addNonBreakingSpace() {
			onChange( insert( value, NBSP ) );
		}

		const range = getNonBreakingSpaceRange( value );

		function replaceNonBreakingSpaces() {
			if ( ! range ) {
				return;
			}

			const [ from, to ] = range;
			const { text } = value;
			onChange( {
				...value,
				text:
					text.slice( 0, from ) +
					text.slice( from, to ).replaceAll( NBSP, ' ' ) +
					text.slice( to ),
			} );
			onFocus();
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
				{ range && (
					<RichTextToolbarButton
						name="non-breaking-space"
						icon={ icon }
						title={ __( 'Replace non-breaking spaces' ) }
						onClick={ replaceNonBreakingSpaces }
						isActive
					/>
				) }
				{ selectedValue === NBSP && (
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
