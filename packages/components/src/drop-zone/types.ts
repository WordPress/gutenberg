export type DropType = 'file' | 'html' | 'default';

export type DropZoneProps = {
	/**
	 * A CSS `class` to give to the wrapper element.
	 */
	className?: string;
	/**
	 * A string to be shown within the drop zone area.
	 *
	 * @default `__( 'Drop files to upload' )`
	 */
	label?: string;
	/**
	 * The function is generic drop handler called if the `onFilesDrop` or `onHTMLDrop` are not called.
	 * It receives the drop `event` object as an argument.
	 */
	onDrop?: ( event: DragEvent ) => void;
	/**
	 * The function is called when dropping a file into the `DropZone`.
	 * It receives an array of dropped files as an argument.
	 */
	onFilesDrop?: ( files: File[] ) => void;
	/**
	 * The function is called when dropping HTML into the `DropZone`.
	 * It receives the HTML being dropped as an argument.
	 */
	onHTMLDrop?: ( html: string ) => void;
};
