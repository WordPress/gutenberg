<?php
class WP_Filesystem_MockFS extends WP_Filesystem_Base {
	private $cwd;

	// Holds a array of objects which contain an array of objects, etc.
	private $fs = null;

	// Holds a array of /path/to/file.php and /path/to/dir/ map to an object in $fs above
	// a fast more efficient way of determining if a path exists, and access to that node
	private $fs_map = array();

	public $verbose = false; // Enable to debug WP_Filesystem_Base::find_folder() / etc.
	public $errors = array();
	public $method = 'MockFS';

	function __construct() {}

	function connect() {
		return true;
	}

	// Copy of core's function, but accepts a path.
	function abspath( $path = false ) {
		if ( ! $path )
			$path = ABSPATH;
		$folder = $this->find_folder( $path );

		// Perhaps the FTP folder is rooted at the WordPress install, Check for wp-includes folder in root, Could have some false positives, but rare.
		if ( ! $folder && $this->is_dir('/wp-includes') )
			$folder = '/';
		return $folder;
	}

	// Mock FS specific functions:

	/**
	 * Sets initial filesystem environment and/or clears the current environment.
	 * Can also be passed the initial filesystem to be setup which is passed to self::setfs()
	 */
	function init( $paths = '', $home_dir = '/' ) {
		$this->fs = new MockFS_Directory_Node( '/' );
		$this->fs_map = array(
			'/' => $this->fs,
		);
		$this->cache = array(); // Used by find_folder() and friends
		$this->cwd = isset( $this->fs_map[ $home_dir ] ) ? $this->fs_map[ $home_dir ] : '/';
		$this->setfs( $paths );
	}

	/**
	 * "Bulk Loads" a filesystem into the internal virtual filesystem
	 */
	function setfs( $paths ) {
		if ( ! is_array($paths) )
			$paths = explode( "\n", $paths );

		$paths = array_filter( array_map( 'trim', $paths ) );

		foreach ( $paths as $path ) {
			// Allow for comments
			if ( '#' == $path[0] )
				continue;

			// Directories
			if ( '/' == $path[ strlen($path) -1 ] )
				$this->mkdir( $path );
			else // Files (with dummy content for now)
				$this->put_contents( $path, 'This is a test file' );
		}

	}

	/**
	 * Locates a filesystem "node"
	 */
	private function locate_node( $path ) {
		return isset( $this->fs_map[ $path ] ) ? $this->fs_map[ $path ] : false;
	}

	/**
	 * Locates a filesystem node for the parent of the given item
	 */
	private function locate_parent_node( $path ) {
		$dirname = str_replace( '\\', '/', dirname( $path ) );
		return $this->locate_node( trailingslashit( $dirname ) );
	}

	// Here starteth the WP_Filesystem functions.

	function mkdir( $path, /* Optional args are ignored */ $chmod = false, $chown = false, $chgrp = false ) {
		$path = trailingslashit( $path );

		$parent_node = $this->locate_parent_node( $path );
		if ( ! $parent_node ) {
			$dirname = str_replace( '\\', '/', dirname( $path ) );
			$this->mkdir( $dirname );
			$parent_node = $this->locate_parent_node( $path );
			if ( ! $parent_node )
				return false;
		}

		$node = new MockFS_Directory_Node( $path );

		$parent_node->children[ $node->name ] = $node;
		$this->fs_map[ $path ] = $node;

		return true;
	}

	function put_contents( $path, $contents = '', $mode = null ) {
		if ( ! $this->is_dir( dirname( $path ) ) )
			$this->mkdir( dirname( $path ) );

		$parent = $this->locate_parent_node( $path );
		$new_file = new MockFS_File_Node( $path, $contents );

		$parent->children[ $new_file->name ] = $new_file;
		$this->fs_map[ $path ] = $new_file;
	}

	function get_contents( $file ) {
		if ( ! $this->is_file( $file ) )
			return false;
		return $this->fs_map[ $file ]->contents;
	}

	function cwd() {
		return $this->cwd->path;
	}

	function chdir( $path ) {
		if ( ! isset( $this->fs_map[ $path ] ) )
			return false;

		$this->cwd = $this->fs_map[ $path ];
		return true;
	}

	function exists( $path ) {
		return isset( $this->fs_map[ $path ] ) || isset( $this->fs_map[ trailingslashit( $path ) ] );
	}

	function is_file( $file ) {
		return isset( $this->fs_map[ $file ] ) && $this->fs_map[ $file ]->is_file();
	}

	function is_dir( $path ) {
		$path = trailingslashit( $path );

		return isset( $this->fs_map[ $path ] ) && $this->fs_map[ $path ]->is_dir();
	}

	function dirlist( $path = '.', $include_hidden = true, $recursive = false ) {

		if ( empty( $path ) || '.' == $path )
			$path = $this->cwd();

		if ( ! $this->exists( $path ) )
			return false;

		$limit_file = false;
		if ( $this->is_file( $path ) ) {
			$limit_file = $this->locate_node( $path )->name;
			$path = dirname( $path ) . '/';
		}

		$ret = array();
		foreach ( $this->fs_map[ $path ]->children as $entry ) {
			if ( '.' == $entry->name || '..' == $entry->name )
				continue;

			if ( ! $include_hidden && '.' == $entry->name )
				continue;

			if ( $limit_file && $entry->name != $limit_file )
				continue;

			$struc = array();
			$struc['name'] = $entry->name;
			$struc['type'] = $entry->type;

			if ( 'd' == $struc['type'] ) {
				if ( $recursive )
					$struc['files'] = $this->dirlist( trailingslashit( $path ) . trailingslashit( $struc['name'] ), $include_hidden, $recursive );
				else
					$struc['files'] = array();
			}

			$ret[ $entry->name ] = $struc;
		}
		return $ret;
	}

}

class MockFS_Node {
	public $name; // The "name" of the entry, does not include a slash (exception, root)
	public $type; // The type of the entry 'f' for file, 'd' for Directory
	public $path; // The full path to the entry.

	function __construct( $path ) {
		$this->path = $path;
		$this->name = basename( $path );
	}

	function is_file() {
		return $this->type == 'f';
	}

	function is_dir() {
		return $this->type == 'd';
	}
}

class MockFS_Directory_Node extends MockFS_Node {
	public $type = 'd';
	public $children = array(); // The child nodes of this directory
}

class MockFS_File_Node extends MockFS_Node {
	public $type = 'f';
	public $contents = ''; // The contents of the file

	function __construct( $path, $contents = '' ) {
		parent::__construct( $path );
		$this->contents = $contents;
	}
}