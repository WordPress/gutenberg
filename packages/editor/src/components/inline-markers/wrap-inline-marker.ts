import { RichTextData, create } from '@wordpress/rich-text';

/**
 * Whether two formats are the same: same type, same attributes.
 *
 * @param a Format.
 * @param b Format.
 * @return True when equal.
 */
function isSameFormat( a: any, b: any ): boolean {
	if ( a.type !== b.type ) {
		return false;
	}
	const keysA = Object.keys( a.attributes ?? {} );
	const keysB = Object.keys( b.attributes ?? {} );
	return (
		keysA.length === keysB.length &&
		keysA.every( ( key ) => a.attributes[ key ] === b.attributes?.[ key ] )
	);
}

/**
 * Wrap a rich-text range with an inline `<mark>` marker format. Returns a new
 * RichTextData ready to write back into block attributes, or null when the
 * incoming value isn't a rich-text instance (legacy/string attributes).
 *
 * The marker is added to every character's format stack rather than applied
 * with `applyFormat`, which replaces any format of the same type in the
 * range: a marker of the same type with a different id stays, so markers of
 * one type can overlap and nest.
 *
 * @param value              Existing block attribute value.
 * @param options            Options.
 * @param options.formatType Rich-text format type to apply (e.g. `core/note`).
 * @param options.attributes Marker attributes (e.g. `{ 'data-id': '7' }`).
 * @param options.start      Range start offset.
 * @param options.end        Range end offset.
 * @return Wrapped value or null when the attribute isn't rich text.
 */
export function wrapInlineMarker(
	value: any,
	{
		formatType,
		attributes,
		start,
		end,
	}: {
		formatType: string;
		attributes: Record< string, string >;
		start: number;
		end: number;
	}
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const record = create( { html: value.toHTMLString() } );
	const marker = { type: formatType, attributes };
	const formats = record.formats.slice();
	for ( let index = Math.max( 0, start ); index < end; index++ ) {
		if ( index >= formats.length ) {
			break;
		}
		const stack: any[] = formats[ index ] ?? [];
		formats[ index ] = stack.some( ( format ) =>
			isSameFormat( format, marker )
		)
			? stack
			: [ ...stack, marker ];
	}
	return new RichTextData( { ...record, formats } as any );
}
