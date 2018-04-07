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
		$handle = '';
		foreach ( (array) $handles as $handle ) {
			$this->queue_i18n_chunk_for_handle( $handle );
		}
		if ( $handle && ! empty( $this->queued_chunk_translations ) ) {
			foreach ( $this->queued_chunk_translations as $domain => $translations ) {
				$translations = call_user_func_array( 'array_merge', $translations );
				wp_add_inline_script(
					$handle,
					'wp.i18n.setLocaleData( ' . json_encode( $translations ) . ', "' . $domain . '" );'
				);
			}
		}
		return $handles;
	}


	/**
	 * Queues up the translation strings for the given handle.
	 *
	 * @param string $handle
	 */
	private function queue_i18n_chunk_for_handle( $handle ) {
		if ( isset( $this->registered_i18n[ $handle ] ) ) {
			list( $chunk, $domain ) = $this->registered_i18n[ $handle ];
			if ( ! isset( $this->queued_chunk_translations[ $domain ] ) ) {
				$this->queued_chunk_translations[ $domain ][''] = $this->get_initial_jed_locale_data_for_domain( $domain );
			}
			$this->queued_chunk_translations[ $domain ][] = $this->get_jed_locale_data_for_domain_and_chunk( $chunk, $domain );
			//make sure we only enqueue once
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
				file_get_contents(gutenberg_dir_path() . 'translation-map.json' ),
				true
			);
		}
		$this->chunk_map = $chunk_map;
	}


	/**
	 * Provides the base locale data for the domain.
	 *
	 * @param $domain
	 * @return mixed
	 */
	protected function get_initial_jed_locale_data_for_domain( $domain ) {
		$locale_data = gutenberg_get_jed_locale_data( $domain );
		return $locale_data[''];
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
		//unset the empty string index because we've already taken care of that earlier
		unset ( $translations[''] );
		return $this->get_locale_data_matching_map(
			$this->get_original_strings_for_chunk_from_map( $chunk ),
			$translations
		);
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
