<?php

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * This class handles queueing up only the translations for javascript files that have been enqueued for translation.
 *
 * @since   1.0.0
 */
class GB_Scripts {

	/**
	 * Will hold all registered i18n scripts.
	 *
	 * @var array
	 */
	private $registered_i18n = array();


	/**
	 * Used to hold queued translations for the chunks loading in a view.
	 *
	 * @var array
	 */
	private $queued_chunk_translations = array();


	/**
	 * Obtained from the generated json file from the all javascript using wp.i18n with a map of chunk names to
	 * translation strings.
	 *
	 * @var array
	 */
	private $chunk_map;


	/**
	 * GB_Scripts constructor.
	 *
	 * @param array() $chunk_map  An array of chunks and the strings translated for those chunks.  If not provided class
	 *                            will look for map in root of plugin with filename of 'translation-map.json'.
	 */
	public function __construct( $chunk_map = array() ) {
		$this->set_chunk_map( $chunk_map );
		add_filter( 'print_scripts_array', array( $this, 'queue_i18n' ) );
	}


	/**
	 * Used to register a script that has i18n strings for its $chunk_name
	 *
	 * @param string $handle
	 * @param string $chunk_name
	 * @param string $domain
	 */
	public function register_script_i18n( $handle, $chunk_name, $domain ) {
		$this->registered_i18n[ $handle ] = array( $chunk_name, $domain );
	}


	/**
	 * Callback on print_scripts_array to listen for scripts enqueued and handle seting up the localized data.
	 *
	 * @param $handles
	 *
	 * @return array
	 */
	public function queue_i18n( $handles ) {
		if ( empty( $this->registered_i18n ) || empty( $this->chunk_map ) ) {
			return $handles;
		}
		foreach ( ( array ) $handles as $handle ) {
			$this->queue_i18n_chunk_for_handle( $handle );
		}
		if ( $this->queued_chunk_translations ) {
			foreach ( $this->queued_chunk_translations as $handle => $translations_for_domain ) {
				$this->register_inline_script(
					$handle,
					$translations_for_domain[ 'translations' ],
					$translations_for_domain[ 'domain' ]
				);
			}
		}
		return $handles;
	}
	
	
	/**
	 * Registers inline script with translations for given handle and domain.
	 *
	 * @param string $handle  Handle used to register javascript file containing translations
	 * @param array  $translations
	 * @param string $domain    Domain for translations.  If left empty then strings are registered with the default
	 *                          domain for the javascript.
	 */
	private function register_inline_script( $handle, $translations, $domain = '' ) {
		$script = $domain ?
			'wp.i18n.setLocaleData( ' . json_encode( $translations ) . ', ' . $domain .  ' );' :
			'wp.i18n.setLocaleData( ' . json_encode( $translations ) . ' );';
		wp_add_inline_script(
			$handle,
			$script,
			'before'
		);
	}


	/**
	 * Queues up the translation strings for the given handle.
	 *
	 * @param string $handle
	 */
	private function queue_i18n_chunk_for_handle( $handle ) {
		if ( isset( $this->registered_i18n[ $handle ] ) ) {
			list( $chunk, $domain ) = $this->registered_i18n[ $handle ];
			$translations = $this->get_jed_locale_data_for_domain_and_chunk( $chunk, $domain );
			if ( count( $translations ) > 1 ) {
				$this->queued_chunk_translations[ $handle ] = array(
					'domain'       => $domain,
					'translations' => $this->get_jed_locale_data_for_domain_and_chunk( $chunk, $domain )
				);
			}
			unset ( $this->registered_i18n[ $handle ] );
		}
	}


	/**
	 * Sets the internal chunk_map property.
	 *
	 * If $chunk_map is empty or not an array, will attempt to load a chunk map from a default named map.
	 *
	 * @param array $chunk_map
	 */
	private function set_chunk_map( $chunk_map ) {
		if ( empty( $chunk_map ) || ! is_array( $chunk_map) ) {
			$chunk_map = json_decode(
				file_get_contents( gutenberg_dir_path() . 'translation-map.json' ),
				true
			);
		}
		$this->chunk_map = $chunk_map;
	}


	/**
	 * Get the jed locale data for a given chunk and domain
	 *
	 * @param string $chunk
	 * @param string $domain
	 *
	 * @return array()
	 */
	protected function get_jed_locale_data_for_domain_and_chunk( $chunk, $domain ) {
		$translations = gutenberg_get_jed_locale_data( $domain );
		//get index for adding back after extracting strings for this $chunk
		$index = $translations[ '' ];
		$translations = $this->get_locale_data_matching_map(
			$this->get_original_strings_for_chunk_from_map( $chunk ),
			$translations
		);
		$translations[ '' ] = $index;
		return $translations;
	}


	/**
	 * Get locale data for given strings from given translations
	 *
	 * @param $string_set
	 * @param $translations
	 *
	 * @return array
	 */
	protected function get_locale_data_matching_map( $string_set, $translations ) {
		if ( ! is_array( $string_set ) || ! is_array( $translations ) || empty ( $string_set ) ) {
			return array();
		}
		//some strings with quotes in them will break on the array_flip, so making sure quotes in the string are slashed
		$string_set = wp_slash( $string_set );
		return array_intersect_key( $translations, array_flip( $string_set ) );
	}


	/**
	 * Get original strings to translate for the given chunk from the map
	 *
	 * @param string $chunk_name
	 *
	 * @return array
	 */
	protected function get_original_strings_for_chunk_from_map( $chunk_name ) {
		return isset( $this->chunk_map[ $chunk_name ] ) ? $this->chunk_map[ $chunk_name ] : array();
	}
}
