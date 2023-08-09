export class RichTextFormats {
	private formats: object[];

	public static ofSize( n: number ): RichTextFormats {
		const formats = new RichTextFormats();
		formats.formats = Array( n );

		return formats;
	}

	constructor( formats = null ) {
		this.formats = formats ?? [];
	}

	public append( otherFormats: RichTextFormats ) {
		this.formats = this.formats.concat( otherFormats );
	}

	public at( codeUnitOffset: number ): object | null {
		if ( codeUnitOffset > 0 && codeUnitOffset < this.formats.length ) {
			return this.formats[ codeUnitOffset ];
		}

		return null;
	}

	public extendLengthBy( codeUnitLength: number ): void {
		this.formats.length += codeUnitLength;
	}
}
