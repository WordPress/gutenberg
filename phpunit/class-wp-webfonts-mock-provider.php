<?php
/**
 * Enqueue only webfonts listed in theme.json helper file.
 *
 * @package    Gutenberg
 */

/**
 * An additional provider so we can test whether font family's
 * faces registration through multiple providers work.
 */
class WP_Webfonts_Mock_Provider extends WP_Webfonts_Provider_Local {
	/**
	 * The provider's unique ID.
	 *
	 * @since 6.0.0
	 *
	 * @var string
	 */
	protected $id = 'mock';
}
