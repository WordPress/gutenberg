<?php
/**
 * Blocks API: WP_Block_List class
 *
 * @package Gutenberg
 */

/**
 * Class representing a list of block instances.
 *
 * This class can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/49926
 * @see https://core.trac.wordpress.org/changeset/48159
 */
class WP_Block_List implements Iterator, ArrayAccess, Countable {

	/**
	 * Original array of parsed block data.
	 *
	 * @var array|WP_Block[]
	 * @access protected
	 */
	protected $blocks;

	/**
	 * All available context of the current hierarchy.
	 *
	 * @var array
	 * @access protected
	 */
	protected $available_context;

	/**
	 * Block type registry to use in constructing block instances.
	 *
	 * @var WP_Block_Type_Registry
	 * @access protected
	 */
	protected $registry;

	/**
	 * Constructor.
	 *
	 * Populates object properties from the provided block instance argument.
	 *
	 * @param array|WP_Block[]       $blocks            Array of parsed block data, or block instances.
	 * @param array                  $available_context Optional array of ancestry context values.
	 * @param WP_Block_Type_Registry $registry          Optional block type registry.
	 */
	public function __construct( $blocks, $available_context = array(), $registry = null ) {
		if ( is_null( $registry ) ) {
			$registry = WP_Block_Type_Registry::get_instance();
		}

		$this->blocks            = $blocks;
		$this->available_context = $available_context;
		$this->registry          = $registry;
	}

	/*
	 * ArrayAccess interface methods.
	 */

	/**
	 * Returns true if a block exists by the specified block index, or false
	 * otherwise.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetexists.php
	 *
	 * @param string $index Index of block to check.
	 *
	 * @return bool Whether block exists.
	 */
	public function offsetExists( $index ) {
		return isset( $this->blocks[ $index ] );
	}

	/**
	 * Returns the value by the specified block index.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetget.php
	 *
	 * @param string $index Index of block value to retrieve.
	 *
	 * @return mixed|null Block value if exists, or null.
	 */
	public function offsetGet( $index ) {
		$block = $this->blocks[ $index ];

		if ( isset( $block ) && is_array( $block ) ) {
			$block                  = new WP_Block( $block, $this->available_context, $this->registry );
			$this->blocks[ $index ] = $block;
		}

		return $block;
	}

	/**
	 * Assign a block value by the specified block index.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetset.php
	 *
	 * @param string $index Index of block value to set.
	 * @param mixed  $value Block value.
	 */
	public function offsetSet( $index, $value ) {
		if ( is_null( $index ) ) {
			$this->blocks[] = $value;
		} else {
			$this->blocks[ $index ] = $value;
		}
	}

	/**
	 * Unset a block.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetunset.php
	 *
	 * @param string $index Index of block value to unset.
	 */
	public function offsetUnset( $index ) {
		unset( $this->blocks[ $index ] );
	}

	/*
	 * Iterator interface methods.
	 */

	/**
	 * Rewinds back to the first element of the Iterator.
	 *
	 * @link https://www.php.net/manual/en/iterator.rewind.php
	 */
	public function rewind() {
		reset( $this->blocks );
	}

	/**
	 * Returns the current element of the block list.
	 *
	 * @link https://www.php.net/manual/en/iterator.current.php
	 *
	 * @return mixed Current element.
	 */
	public function current() {
		return $this->offsetGet( $this->key() );
	}

	/**
	 * Returns the key of the current element of the block list.
	 *
	 * @link https://www.php.net/manual/en/iterator.key.php
	 *
	 * @return mixed Key of the current element.
	 */
	public function key() {
		return key( $this->blocks );
	}

	/**
	 * Moves the current position of the block list to the next element.
	 *
	 * @link https://www.php.net/manual/en/iterator.next.php
	 */
	public function next() {
		next( $this->blocks );
	}

	/**
	 * Checks if current position is valid.
	 *
	 * @link https://www.php.net/manual/en/iterator.valid.php
	 */
	public function valid() {
		return null !== key( $this->blocks );
	}

	/*
	 * Countable interface methods.
	 */

	/**
	 * Returns the count of blocks in the list.
	 *
	 * @link https://www.php.net/manual/en/countable.count.php
	 *
	 * @return int Block count.
	 */
	public function count() {
		return count( $this->blocks );
	}

}
