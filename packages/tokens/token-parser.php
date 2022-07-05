<?php

class WP_Token
{
	/**
	 * @var string
	 */
	public $namespace;

	/**
	 * @var string
	 */
	public $name;

	/**
	 * @var mixed
	 */
	public $value;

	/**
	 * @var string
	 */
	public $fallback;

	function __construct( $namespace, $name, $value = null, $fallback = '' ) {
		$this->namespace  = $namespace;
		$this->name       = $name;
		$this->value      = $value;
		$this->fallback   = $fallback;
	}
}

class WP_Token_Parser
{
	/**
	 * Replaces dynamic tokens in a document with the return value
	 * from their callback or with a fallback value if one exists.
	 */
	public static function swap_tokens( $token_replacer, $input )
	{
		if ( ! is_callable( $token_replacer ) ) {
			return null;
		}

		if ( ! is_string( $input ) ) {
			return null;
		}

		return preg_replace_callback(
			"~(?P<QUOTED>#)?#{(?P<TOKEN_CONTENTS>[^#]*)}#~",
			function ( $matches ) use ( $token_replacer ) {
				list( '0' => $full_match, 'QUOTED' => $quoted, 'TOKEN_CONTENTS' => $contents ) = $matches;

				if ( ! empty( $quoted ) ) {
					return $full_match;
				}

				$token = self::parse_token_contents( $contents );
				if ( ! $token ) {
					/*
					 * Something is malformed. Hide the token to
					 * avoid exposing internal or private data.
					 */
					return '';
				}

				$output = call_user_func( $token_replacer, $token );
				return null !== $output ? $output : $token->fallback;
			},
			$input
		);
	}


	/**
	 * Parses the inner contents of a token.
	 *
	 * @param string $contents
	 * @return WP_Token|null The parsed token.
	 */
	public static function parse_token_contents( $contents ) {
		$matches = null;

		/*
		 * Token shorthand syntax allows for quicker entry of simple tokens.
		 *
		 * Examples:
		 *     #{identity}#
		 *     #{core/identity}#
		 *     #{echo="\u003ctest\u003e"}#  <-- "<test>"
		 *     #{plugin-url="my_plugin"}#
		 *     #{my_plugin/weather={"stat": "temperature", "units": "C"}}#
		 */
		if ( 1 === preg_match(
			'~^(?:(?P<NAMESPACE>[a-z][a-z\d_-]*)/)?(?P<NAME>[a-z][a-z\d_-]*)(?:=(?P<VALUE>.+))?$~i',
			$contents,
			$matches
		)) {
			$rawNamespace = isset( $matches['NAMESPACE'] ) ? $matches['NAMESPACE'] : '';
			$namespace    = empty( $rawNamespace ) ? 'core' : $rawNamespace;
			$name         = $matches['NAME'];
			$rawValue     = isset( $matches['VALUE'] ) ? $matches['VALUE'] : '';
			$value        = ! empty( $rawValue ) ? self::json_decode( $rawValue ) : null;

			return null === $value
				? new WP_Token( $namespace, $name )
				: new WP_Token( $namespace, $name, $value );
		}

		/*
		 * If not using the shorthand syntax we have to attempt to parse this as augmented JSON.
		 *
		 * Examples:
		 *     #{"name":"query/published-date", "value":{"format":"%A"}}#
		 *     #{"name":"my-plugin/weather", "value":{"stat":"temperature", "units": "C"}, "fallback": "hot"}#
		 */
		$token_data = self::json_decode( "{{$contents}}" );
		if ( null === $token_data ) {
			/*
			 * Because we wrap this in curly brackets `null` is
			 * not a possible valid parse, meaning if we get
			 * this value it indicates that our parse failed.
			 */
			return null;
		}

		$name_matches = null;
		$token_name = isset( $token_data['token'] ) ? $token_data['token'] : '';
		if ( ! preg_match( '~^(?:(?P<NAMESPACE>[a-z][a-z\d_-]*)/)?(?P<NAME>[a-z][a-z\d_-]*)$~i', $token_name, $name_matches ) ) {
			return null;
		}

		$rawNamespace = isset( $name_matches['NAMESPACE'] ) ? $name_matches['NAMESPACE'] : '';
		$namespace    = empty( $rawNamespace ) ? 'core' : $rawNamespace;

		return new WP_Token(
			$namespace,
			$name_matches['NAME'],
			isset( $token_data['value'] ) ? $token_data['value'] : null,
			isset( $token_data['fallback'] ) ? $token_data['fallback'] : ''
		);
	}


	public static function json_decode( $input ) {
		return json_decode( $input, JSON_OBJECT_AS_ARRAY );
	}
}
