export interface DateFormatPickerProps {
	/** The selected date format. If `null`, _Default_ is selected. */
	format: string | null;
	/** The date format that will be used if the user selects 'Default'. */
	defaultFormat: string;
	/** Called when a selection is made. If `null`, _Default_ is selected. */
	onChange: ( format: string | null ) => void;
}

export interface NonDefaultControlsProps {
	/** The selected date format. */
	format: string;
	/** Called when a selection is made. */
	onChange: ( format: string | null ) => void;
}
