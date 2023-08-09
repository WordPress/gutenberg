import { RichTextFormats } from './rich-text-formats';
import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';

type Replacement = object;

export class RichTextState {
	private formats: RichTextFormats;
	private replacements: Replacement[];
	private text: string;
	private selectionStart: number | null = null;
	private selectionEnd: number | null = null;

	public static fromReplacement( replacement: Replacement ) {
		const state = RichTextState.fromText( OBJECT_REPLACEMENT_CHARACTER );
		state.replaceAt( 0, replacement );

		return state;
	}

	public static fromText( text: string ): RichTextState {
		const state = new RichTextState();
		state.formats = RichTextFormats.ofSize( text.length );
		state.replacements = Array( text.length );
		state.text = text;

		return state;
	}

	constructor() {
		this.formats = new RichTextFormats();
		this.replacements = [];
		this.text = '';
	}

	public append( otherRichTextState: RichTextState ): void {
		this.formats.append( otherRichTextState.formats );
		this.replacements = this.replacements.concat( otherRichTextState.replacements );
		this.text += otherRichTextState.text;
	}

	public extendText( text: string ): void {
		this.formats.extendLengthBy( text.length );
		this.replacements.length += text.length;
		this.text += text;
	}

	public codeUnitLength() {
		return this.text.length;
	}

	public replaceAt( codeUnitOffset: number, replacement: Replacement ) {
		this.replacements[ codeUnitOffset ] = replacement;
	}

	public startSelectionAt( codeUnitOffset: number ): void {
		this.selectionStart = codeUnitOffset;
	}

	public selectionStartsAt(): number | null {
		return this.selectionStart;
	}

	public endSelectionAt( codeUnitOffset: number ): void {
		this.selectionEnd = codeUnitOffset;
	}

	public selectionEndsAt(): number | null {
		return this.selectionEnd;
	}
}
