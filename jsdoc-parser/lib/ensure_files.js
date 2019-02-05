module.exports = function ( files, file_path, base_path ) {
	if ( ! files[ file_path ] ) {
		files[ file_path ] = {
			file: { tags: [] },
			path: file_path,
			root: base_path,
			classes: [],
			functions: [],
			constants: [],
			hooks: [],
		}
	}

	return files;
};
