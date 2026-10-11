/**
 * Gets all files from a DataTransfer object.
 *
 * @param dataTransfer DataTransfer object to inspect.
 *
 * @return An array containing all files.
 */
export function getFilesFromDataTransfer( dataTransfer: DataTransfer ): File[] {
	const files = Array.from( dataTransfer.files );

	Array.from( dataTransfer.items ).forEach( ( item ) => {
		const file = item.getAsFile();

		if (
			file &&
			! files.find(
				( { name, type, size } ) =>
					name === file.name &&
					type === file.type &&
					size === file.size
			)
		) {
			files.push( file );
		}
	} );

	return files;
}
