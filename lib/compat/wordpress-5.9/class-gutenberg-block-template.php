<?php
/**
 * Blocks API: Gutenberg_Block_Template class
 *
 * @package WordPress
 * @since 5.5.0
 */

/**
 * Class representing a block template.
 */
class Gutenberg_Block_Template {

	/**
	 * Type: wp_template or wp_template_part
	 *
	 * @var string
	 */
	public $type;

	/**
	 * Theme.
	 *
	 * @var string
	 */
	public $theme;

	/**
	 * Template slug.
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Id.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * Title.
	 *
	 * @var string
	 */
	public $title = '';

	/**
	 * Content.
	 *
	 * @var string
	 */
	public $content = '';

	/**
	 * Description.
	 *
	 * @var string
	 */
	public $description = '';

	/**
	 * Source of the content. `theme` and `custom` is used for now.
	 *
	 * @var string
	 */
	public $source = 'theme';

	/**
	 * Origin of the content when the content has been customized.
	 * When customized, origin takes on the value of source and source becomes
	 * 'custom'.
	 *
	 * @var string
	 */
	public $origin;

	/**
	 * Post Id.
	 *
	 * @var integer|null
	 */
	public $wp_id;

	/**
	 * Template Status.
	 *
	 * @var string
	 */
	public $status;

	/**
	 * Whether a template is, or is based upon, an existing template file.
	 *
	 * @var boolean
	 */
	public $has_theme_file;

	/**
	 * Whether a template is a custom template.
	 *
	 * @var bool
	 */
	public $is_custom = true;

	/**
	 * Author.
	 *
	 * A value of 0 means no author.
	 *
	 * @var int
	 */
	public $author = 0;

	/**
	 * Post types.
	 *
	 * @since 5.9.0
	 * @var array
	 */
	public $post_types;

	/**
	 * Area.
	 *
	 * @since 5.9.0
	 * @var string
	 */
	public $area;
}
