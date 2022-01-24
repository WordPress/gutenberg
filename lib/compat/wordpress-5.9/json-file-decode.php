<?php
/**
 * Function to read json files.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_json_file_decode' ) ) {
	/**
	 * Reads and decodes a JSON file.
	 *
	 * @param string $filename Path to the JSON file.
	 * @param array  $options  {
	 *     Optional. Options to be used with `json_decode()`.
	 *
	 *     @type bool associative Optional. When `true`, JSON objects will be returned as associative arrays.
	 *                            When `false`, JSON objects will be returned as objects.
	 * }
	 *
	 * @return mixed Returns the value encoded in JSON in appropriate PHP type.
	 *               `null` is returned if the file is not found, or its content can't be decoded.
	 */
	function wp_json_file_decode( $filename, $options = array() ) {
		$result   = null;
		$filename = wp_normalize_path( realpath( $filename ) );
		if ( ! file_exists( $filename ) ) {
			trigger_error(
				sprintf(
				/* translators: %s: Path to the JSON file. */
					__( "File %s doesn't exist!", 'gutenberg' ),
					$filename
				)
			);
			return $result;
		}

		$options      = wp_parse_args( $options, array( 'associative' => false ) );
		$decoded_file = json_decode( file_get_contents( $filename ), $options['associative'] );

		if ( JSON_ERROR_NONE !== json_last_error() ) {
			trigger_error(
				sprintf(
				/* translators: 1: Path to the JSON file, 2: Error message. */
					__( 'Error when decoding a JSON file at path %1$s: %2$s', 'gutenberg' ),
					$filename,
					json_last_error_msg()
				)
			);
			return $result;
		}

		return $decoded_file;
	}
}
