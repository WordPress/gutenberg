import { __ } from '@wordpress/i18n';
import {
	applyFormat,
	create,
	insert,
	RichTextData,
	useAnchor,
} from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import {
	RichTextShortcut,
	RichTextToolbarButton,
	store as blockEditorStore,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import { Popover, SVG, Path } from '@wordpress/components';
import type { FormatEditProps } from '../types';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );
const NBSP = ' ';

const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M4.5 9.5H6V14h12V9.5h1.5v6h-15z" />
	</SVG>
);

type HandlerContext = {
	richTextIdentifier: string;
	blockClientId: string;
};

type SelectionPoint = {
	clientId?: string;
	attributeKey?: string;
	offset?: number;
};

/**
 * Returns the part of a field that the selection covers, also when the
 * selection runs across blocks.
 *
 * @param select                     The registry select function.
 * @param context                    The field.
 * @param context.richTextIdentifier The attribute key of the field.
 * @param context.blockClientId      The block holding the field.
 */
function getSelectedRange(
	select: ( store: unknown ) => any,
	{ richTextIdentifier, blockClientId }: HandlerContext
): [ number, number ] | undefined {
	const {
		getSelectionStart,
		getSelectionEnd,
		getFirstMultiSelectedBlockClientId,
		getBlockParents,
		isBlockMultiSelected,
		isAncestorMultiSelected,
	} = select( blockEditorStore );
	const start: SelectionPoint = getSelectionStart();
	const end: SelectionPoint = getSelectionEnd();

	if ( start.clientId === end.clientId ) {
		if (
			start.clientId !== blockClientId ||
			start.attributeKey !== richTextIdentifier ||
			end.attributeKey !== richTextIdentifier ||
			start.offset === undefined ||
			end.offset === undefined
		) {
			return;
		}
		return [
			Math.min( start.offset, end.offset ),
			Math.max( start.offset, end.offset ),
		];
	}

	if ( blockClientId === start.clientId || blockClientId === end.clientId ) {
		const firstClientId = getFirstMultiSelectedBlockClientId();
		const startIsFirst =
			start.clientId === firstClientId ||
			getBlockParents( start.clientId ).includes( firstClientId );
		const [ head, tail ] = startIsFirst ? [ start, end ] : [ end, start ];
		const point = blockClientId === head.clientId ? head : tail;
		// Without a field, the whole block is selected.
		if ( point.attributeKey === undefined ) {
			return [ 0, Infinity ];
		}
		if ( point.attributeKey !== richTextIdentifier ) {
			return undefined;
		}
		return point === head
			? [ head.offset ?? 0, Infinity ]
			: [ 0, tail.offset ?? Infinity ];
	}

	if (
		isBlockMultiSelected( blockClientId ) ||
		isAncestorMultiSelected( blockClientId )
	) {
		return [ 0, Infinity ];
	}

	return undefined;
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

		function replaceNonBreakingSpaces() {
			onChange( { ...value, text: value.text.replaceAll( NBSP, ' ' ) } );
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
				{ value.text.includes( NBSP ) && (
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
	// Only the non-breaking spaces in the selection are marked, so the editable
	// tree is prepared again when that set changes.
	__experimentalGetPropsForEditableTreePreparation(
		select: ( store: unknown ) => any,
		context: HandlerContext
	) {
		const range = getSelectedRange( select, context );
		if ( ! range ) {
			return { selected: '' };
		}
		const attribute = select( blockEditorStore ).getBlockAttributes(
			context.blockClientId
		)?.[ context.richTextIdentifier ];
		let text = '';
		if ( attribute instanceof RichTextData ) {
			text = attribute.text;
		} else if ( typeof attribute === 'string' ) {
			text = create( { html: attribute } ).text;
		}
		const indices = [];
		let index = text.indexOf( NBSP, range[ 0 ] );
		while ( index !== -1 && index < range[ 1 ] ) {
			indices.push( index );
			index = text.indexOf( NBSP, index + 1 );
		}
		return { selected: indices.join( ',' ) };
	},
	__experimentalCreatePrepareEditableTree( {
		selected,
	}: {
		selected?: string;
	} ): (
		formats: RichTextValue[ 'formats' ],
		text: string
	) => RichTextValue[ 'formats' ] {
		const indices = selected ? selected.split( ',' ).map( Number ) : [];
		return ( formats, text ) => {
			// Not a complete `RichTextValue`: the callback only receives
			// `formats` and `text`. The assertion is safe because `applyFormat`
			// is passed explicit indices (so it never falls back to `start`/
			// `end`), reads only `formats`, and spreads the rest through
			// untouched — and only `formats` is read back out below.
			let record = { formats, text } as RichTextValue;
			for ( const index of indices ) {
				if ( text[ index ] === NBSP ) {
					record = applyFormat(
						record,
						{ type: name },
						index,
						index + 1
					);
				}
			}
			return record.formats;
		};
	},
};
