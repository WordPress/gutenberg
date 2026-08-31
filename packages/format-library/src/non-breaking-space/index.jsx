import { __ } from '@wordpress/i18n';
import { applyFormat, insert, useAnchor } from '@wordpress/rich-text';
import { RichTextShortcut } from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );

function PopoverAnchor( { contentRef } ) {
	const popoverAnchor = useAnchor( {
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
	edit( { value, onChange, contentRef } ) {
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
	__experimentalCreatePrepareEditableTree() {
		return ( formats, text ) => {
			const NBSP = '\u00a0';
			let record = { formats, text };
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
