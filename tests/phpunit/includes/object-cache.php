<?php
/**
 * Adds a value to cache.
 *
 * If the specified key already exists, the value is not stored and the function
 * returns false.
 *
 * @link http://www.php.net/manual/en/memcached.add.php
 *
 * @param string    $key        The key under which to store the value.
 * @param mixed     $value      The value to store.
 * @param string    $group      The group value appended to the $key.
 * @param int       $expiration The expiration time, defaults to 0.
 * @return bool                 Returns TRUE on success or FALSE on failure.
 */
function wp_cache_add( $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->add( $key, $value, $group, $expiration );
}

/**
 * Adds a value to cache on a specific server.
 *
 * Using a server_key value, the object can be stored on a specified server as opposed
 * to a random server in the stack. Note that this method will add the key/value to the
 * _cache object as part of the runtime cache. It will add it to an array for the
 * specified server_key.
 *
 * @link http://www.php.net/manual/en/memcached.addbykey.php
 *
 * @param string    $server_key     The key identifying the server to store the value on.
 * @param string    $key            The key under which to store the value.
 * @param mixed     $value          The value to store.
 * @param string    $group          The group value appended to the $key.
 * @param int       $expiration     The expiration time, defaults to 0.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_add_by_key( $server_key, $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->addByKey( $server_key, $key, $value, $group, $expiration );
}

/**
 * Add a single server to the list of Memcached servers.
 *
 * @link http://www.php.net/manual/en/memcached.addserver.php
 *
 * @param string        $host   The hostname of the memcache server.
 * @param int           $port   The port on which memcache is running.
 * @param int           $weight The weight of the server relative to the total weight of all the servers in the pool.
 * @return bool                 Returns TRUE on success or FALSE on failure.
 */
function wp_cache_add_server( $host, $port, $weight = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->addServer( $host, $port, $weight );
}

/**
 * Adds an array of servers to the pool.
 *
 * Each individual server in the array must include a domain and port, with an optional
 * weight value: $servers = array( array( '127.0.0.1', 11211, 0 ) );
 *
 * @link http://www.php.net/manual/en/memcached.addservers.php
 *
 * @param array     $servers    Array of server to register.
 * @return bool                 True on success; false on failure.
 */
function wp_cache_add_servers( $servers ) {
	global $wp_object_cache;
	return $wp_object_cache->addServers( $servers );
}

/**
 * Append data to an existing item.
 *
 * This method should throw an error if it is used with compressed data. This
 * is an expected behavior. Memcached casts the value to be appended to the initial value to the
 * type of the initial value. Be careful as this leads to unexpected behavior at times. Due to
 * how memcached treats types, the behavior has been mimicked in the internal cache to produce
 * similar results and improve consistency. It is recommend that appends only occur with data of
 * the same type.
 *
 * @link http://www.php.net/manual/en/memcached.append.php
 *
 * @param string    $key    The key under which to store the value.
 * @param mixed     $value  Must be string as appending mixed values is not well-defined
 * @param string    $group  The group value appended to the $key.
 * @return bool             Returns TRUE on success or FALSE on failure.
 */
function wp_cache_append( $key, $value, $group = '' ) {
	global $wp_object_cache;
	return $wp_object_cache->append( $key, $value, $group );
}

/**
 * Append data to an existing item by server key.
 *
 * This method should throw an error if it is used with compressed data. This
 * is an expected behavior. Memcached casts the value to be appended to the initial value to the
 * type of the initial value. Be careful as this leads to unexpected behavior at times. Due to
 * how memcached treats types, the behavior has been mimicked in the internal cache to produce
 * similar results and improve consistency. It is recommend that appends only occur with data of
 * the same type.
 *
 * @link http://www.php.net/manual/en/memcached.appendbykey.php
 *
 * @param string    $server_key     The key identifying the server to store the value on.
 * @param string    $key            The key under which to store the value.
 * @param mixed     $value          Must be string as appending mixed values is not well-defined
 * @param string    $group          The group value appended to the $key.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_append_by_key( $server_key, $key, $value, $group = '' ) {
	global $wp_object_cache;
	return $wp_object_cache->appendByKey( $server_key, $key, $value, $group );
}

/**
 * Performs a "check and set" to store data.
 *
 * The set will be successful only if the no other request has updated the value since it was fetched by
 * this request.
 *
 * @link http://www.php.net/manual/en/memcached.cas.php
 *
 * @param float     $cas_token  Unique value associated with the existing item. Generated by memcached.
 * @param string    $key        The key under which to store the value.
 * @param mixed     $value      The value to store.
 * @param string    $group      The group value appended to the $key.
 * @param int       $expiration The expiration time, defaults to 0.
 * @return bool                 Returns TRUE on success or FALSE on failure.
 */
function wp_cache_cas( $cas_token, $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->cas( $cas_token, $key, $value, $group, $expiration );
}

/**
 * Performs a "check and set" to store data with a server key.
 *
 * The set will be successful only if the no other request has updated the value since it was fetched by
 * this request.
 *
 * @link http://www.php.net/manual/en/memcached.casbykey.php
 *
 * @param string    $server_key The key identifying the server to store the value on.
 * @param float     $cas_token  Unique value associated with the existing item. Generated by memcached.
 * @param string    $key        The key under which to store the value.
 * @param mixed     $value      The value to store.
 * @param string    $group      The group value appended to the $key.
 * @param int       $expiration The expiration time, defaults to 0.
 * @return bool                 Returns TRUE on success or FALSE on failure.
 */
function wp_cache_cas_by_key( $cas_token, $server_key, $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->casByKey( $cas_token, $server_key, $key, $value, $group, $expiration );
}

/**
 * Closes the cache.
 *
 * This function has ceased to do anything since WordPress 2.5. The
 * functionality was removed along with the rest of the persistent cache. This
 * does not mean that plugins can't implement this function when they need to
 * make sure that the cache is cleaned up after WordPress no longer needs it.
 *
 * @since 2.0.0
 *
 * @return  bool    Always returns True
 */
function wp_cache_close() {
	return true;
}

/**
 * Decrement a numeric item's value.
 *
 * @link http://www.php.net/manual/en/memcached.decrement.php
 *
 * @param string    $key    The key under which to store the value.
 * @param int       $offset The amount by which to decrement the item's value.
 * @param string    $group  The group value appended to the $key.
 * @return int|bool         Returns item's new value on success or FALSE on failure.
 */
function wp_cache_decrement( $key, $offset = 1, $group = '' ) {
	global $wp_object_cache;
	return $wp_object_cache->decrement( $key, $offset, $group );
}

/**
 * Decrement a numeric item's value.
 *
 * Same as wp_cache_decrement. Original WordPress caching backends use wp_cache_decr. I
 * want both spellings to work.
 *
 * @link http://www.php.net/manual/en/memcached.decrement.php
 *
 * @param string    $key    The key under which to store the value.
 * @param int       $offset The amount by which to decrement the item's value.
 * @param string    $group  The group value appended to the $key.
 * @return int|bool         Returns item's new value on success or FALSE on failure.
 */
function wp_cache_decr( $key, $offset = 1, $group = '' ) {
	return wp_cache_decrement( $key, $offset, $group );
}

/**
 * Remove the item from the cache.
 *
 * Remove an item from memcached with identified by $key after $time seconds. The
 * $time parameter allows an object to be queued for deletion without immediately
 * deleting. Between the time that it is queued and the time it's deleted, add,
 * replace, and get will fail, but set will succeed.
 *
 * @link http://www.php.net/manual/en/memcached.delete.php
 *
 * @param string    $key    The key under which to store the value.
 * @param string    $group  The group value appended to the $key.
 * @param int       $time   The amount of time the server will wait to delete the item in seconds.
 * @return bool             Returns TRUE on success or FALSE on failure.
 */
function wp_cache_delete( $key, $group = '', $time = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->delete( $key, $group, $time );
}

/**
 * Remove the item from the cache by server key.
 *
 * Remove an item from memcached with identified by $key after $time seconds. The
 * $time parameter allows an object to be queued for deletion without immediately
 * deleting. Between the time that it is queued and the time it's deleted, add,
 * replace, and get will fail, but set will succeed.
 *
 * @link http://www.php.net/manual/en/memcached.deletebykey.php
 *
 * @param string        $server_key The key identifying the server to store the value on.
 * @param string        $key        The key under which to store the value.
 * @param string        $group      The group value appended to the $key.
 * @param int           $time       The amount of time the server will wait to delete the item in seconds.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_delete_by_key( $server_key, $key, $group = '', $time = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->deleteByKey( $server_key, $key, $group, $time );
}

/**
 * Fetch the next result.
 *
 * @link http://www.php.net/manual/en/memcached.fetch.php
 *
 * @return  array|bool   Returns the next result or FALSE otherwise.
 */
function wp_cache_fetch() {
	global $wp_object_cache;
	return $wp_object_cache->fetch();
}

/**
 * Fetch all remaining results from the last request.
 *
 * @link http://www.php.net/manual/en/memcached.fetchall.php
 *
 * @return  array|bool  Returns the results or FALSE on failure.
 */
function wp_cache_fetch_all() {
	global $wp_object_cache;
	return $wp_object_cache->fetchAll();
}

/**
 * Invalidate all items in the cache.
 *
 * @link http://www.php.net/manual/en/memcached.flush.php
 *
 * @param int       $delay  Number of seconds to wait before invalidating the items.
 * @return bool             Returns TRUE on success or FALSE on failure.
 */
function wp_cache_flush( $delay = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->flush( $delay );
}

/**
 * Retrieve object from cache.
 *
 * Gets an object from cache based on $key and $group. In order to fully support the $cache_cb and $cas_token
 * parameters, the runtime cache is ignored by this function if either of those values are set. If either of
 * those values are set, the request is made directly to the memcached server for proper handling of the
 * callback and/or token.
 *
 * Note that the $deprecated and $found args are only here for compatibility with the native wp_cache_get function.
 *
 * @link http://www.php.net/manual/en/memcached.get.php
 *
 * @param string        $key        The key under which to store the value.
 * @param string        $group      The group value appended to the $key.
 * @param bool          $force      Whether or not to force a cache invalidation.
 * @param null|bool     $found      Variable passed by reference to determine if the value was found or not.
 * @param null|string   $cache_cb   Read-through caching callback.
 * @param null|float    $cas_token  The variable to store the CAS token in.
 * @return bool|mixed               Cached object value.
 */
function wp_cache_get( $key, $group = '', $force = false, &$found = null, $cache_cb = null, &$cas_token = null ) {
	global $wp_object_cache;

	if ( func_num_args() > 4 )
		return $wp_object_cache->get( $key, $group, $force, $found, '', false, $cache_cb, $cas_token );
	else
		return $wp_object_cache->get( $key, $group, $force, $found );
}

/**
 * Retrieve object from cache from specified server.
 *
 * Gets an object from cache based on $key, $group and $server_key. In order to fully support the $cache_cb and $cas_token
 * parameters, the runtime cache is ignored by this function if either of those values are set. If either of
 * those values are set, the request is made directly to the memcached server for proper handling of the
 * callback and/or token.
 *
 * @link http://www.php.net/manual/en/memcached.getbykey.php
 *
 * @param string        $server_key The key identifying the server to store the value on.
 * @param string        $key        The key under which to store the value.
 * @param string        $group      The group value appended to the $key.
 * @param bool          $force      Whether or not to force a cache invalidation.
 * @param null|bool     $found      Variable passed by reference to determine if the value was found or not.
 * @param null|string   $cache_cb   Read-through caching callback.
 * @param null|float    $cas_token  The variable to store the CAS token in.
 * @return bool|mixed               Cached object value.
 */
function wp_cache_get_by_key( $server_key, $key, $group = '', $force = false, &$found = null, $cache_cb = NULL, &$cas_token = NULL ) {
	global $wp_object_cache;

	if ( func_num_args() > 5 )
		return $wp_object_cache->getByKey( $server_key, $key, $group, $force, $found, $cache_cb, $cas_token );
	else
		return $wp_object_cache->getByKey( $server_key, $key, $group, $force, $found );
}

/**
 * Request multiple keys without blocking.
 *
 * @link http://www.php.net/manual/en/memcached.getdelayed.php
 *
 * @param string|array  $keys       Array or string of key(s) to request.
 * @param string|array  $groups     Array or string of group(s) for the key(s). See buildKeys for more on how these are handled.
 * @param bool          $with_cas   Whether to request CAS token values also.
 * @param null          $value_cb   The result callback or NULL.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_get_delayed( $keys, $groups = '', $with_cas = false, $value_cb = NULL ) {
	global $wp_object_cache;
	return $wp_object_cache->getDelayed( $keys, $groups, $with_cas, $value_cb );
}

/**
 * Request multiple keys without blocking from a specified server.
 *
 * @link http://www.php.net/manual/en/memcached.getdelayed.php
 *
 * @param string        $server_key The key identifying the server to store the value on.
 * @param string|array  $keys       Array or string of key(s) to request.
 * @param string|array  $groups     Array or string of group(s) for the key(s). See buildKeys for more on how these are handled.
 * @param bool          $with_cas   Whether to request CAS token values also.
 * @param null          $value_cb   The result callback or NULL.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_get_delayed_by_key( $server_key, $keys, $groups = '', $with_cas = false, $value_cb = NULL ) {
	global $wp_object_cache;
	return $wp_object_cache->getDelayedByKey( $server_key, $keys, $groups, $with_cas, $value_cb );
}

/**
 * Gets multiple values from memcached in one request.
 *
 * See the buildKeys method definition to understand the $keys/$groups parameters.
 *
 * @link http://www.php.net/manual/en/memcached.getmulti.php
 *
 * @param array         $keys       Array of keys to retrieve.
 * @param string|array  $groups     If string, used for all keys. If arrays, corresponds with the $keys array.
 * @param null|array    $cas_tokens The variable to store the CAS tokens for the found items.
 * @param int           $flags      The flags for the get operation.
 * @return bool|array               Returns the array of found items or FALSE on failure.
 */
function wp_cache_get_multi( $keys, $groups = '', &$cas_tokens = NULL, $flags = NULL ) {
	global $wp_object_cache;

	if ( func_num_args() > 2 )
		return $wp_object_cache->getMulti( $keys, $groups, '', $cas_tokens, $flags );
	else
		return $wp_object_cache->getMulti( $keys, $groups );
}

/**
 * Gets multiple values from memcached in one request by specified server key.
 *
 * See the buildKeys method definition to understand the $keys/$groups parameters.
 *
 * @link http://www.php.net/manual/en/memcached.getmultibykey.php
 *
 * @param string        $server_key The key identifying the server to store the value on.
 * @param array         $keys       Array of keys to retrieve.
 * @param string|array  $groups     If string, used for all keys. If arrays, corresponds with the $keys array.
 * @param null|array    $cas_tokens The variable to store the CAS tokens for the found items.
 * @param int           $flags      The flags for the get operation.
 * @return bool|array               Returns the array of found items or FALSE on failure.
 */
function wp_cache_get_multi_by_key( $server_key, $keys, $groups = '', &$cas_tokens = NULL, $flags = NULL ) {
	global $wp_object_cache;

	if ( func_num_args() > 3 )
		return $wp_object_cache->getMultiByKey( $server_key, $keys, $groups, $cas_tokens, $flags );
	else
		return $wp_object_cache->getMultiByKey( $server_key, $keys, $groups );
}

/**
 * Retrieve a Memcached option value.
 *
 * @link http://www.php.net/manual/en/memcached.getoption.php
 *
 * @param int   $option One of the Memcached::OPT_* constants.
 * @return mixed        Returns the value of the requested option, or FALSE on error.
 */
function wp_cache_get_option( $option ) {
	global $wp_object_cache;
	return $wp_object_cache->getOption( $option );
}

/**
 * Return the result code of the last option.
 *
 * @link http://www.php.net/manual/en/memcached.getresultcode.php
 *
 * @return int  Result code of the last Memcached operation.
 */
function wp_cache_get_result_code() {
	global $wp_object_cache;
	return $wp_object_cache->getResultCode();
}

/**
 * Return the message describing the result of the last operation.
 *
 * @link http://www.php.net/manual/en/memcached.getresultmessage.php
 *
 * @return string   Message describing the result of the last Memcached operation.
 */
function wp_cache_get_result_message() {
	global $wp_object_cache;
	return $wp_object_cache->getResultMessage();
}

/**
 * Get server information by key.
 *
 * @link http://www.php.net/manual/en/memcached.getserverbykey.php
 *
 * @param string    $server_key The key identifying the server to store the value on.
 * @return array                Array with host, post, and weight on success, FALSE on failure.
 */
function wp_cache_get_server_by_key( $server_key ) {
	global $wp_object_cache;
	return $wp_object_cache->getServerByKey( $server_key );
}

/**
 * Get the list of servers in the pool.
 *
 * @link http://www.php.net/manual/en/memcached.getserverlist.php
 *
 * @return array    The list of all servers in the server pool.
 */
function wp_cache_get_server_list() {
	global $wp_object_cache;
	return $wp_object_cache->getServerList();
}

/**
 * Get server pool statistics.
 *
 * @link http://www.php.net/manual/en/memcached.getstats.php
 *
 * @return array    Array of server statistics, one entry per server.
 */
function wp_cache_get_stats() {
	global $wp_object_cache;
	return $wp_object_cache->getStats();
}

/**
 * Get server pool memcached version information.
 *
 * @link http://www.php.net/manual/en/memcached.getversion.php
 *
 * @return array    Array of server versions, one entry per server.
 */
function wp_cache_get_version() {
	global $wp_object_cache;
	return $wp_object_cache->getVersion();
}

/**
 * Increment a numeric item's value.
 *
 * @link http://www.php.net/manual/en/memcached.increment.php
 *
 * @param string    $key    The key under which to store the value.
 * @param int       $offset The amount by which to increment the item's value.
 * @param string    $group  The group value appended to the $key.
 * @return int|bool         Returns item's new value on success or FALSE on failure.
 */
function wp_cache_increment( $key, $offset = 1, $group = '' ) {
	global $wp_object_cache;
	return $wp_object_cache->increment( $key, $offset, $group );
}

/**
 * Increment a numeric item's value.
 *
 * This is the same as wp_cache_increment, but kept for back compatibility. The original
 * WordPress caching backends use wp_cache_incr. I want both to work.
 *
 * @link http://www.php.net/manual/en/memcached.increment.php
 *
 * @param string    $key    The key under which to store the value.
 * @param int       $offset The amount by which to increment the item's value.
 * @param string    $group  The group value appended to the $key.
 * @return int|bool         Returns item's new value on success or FALSE on failure.
 */
function wp_cache_incr( $key, $offset = 1, $group = '' ) {
	return wp_cache_increment( $key, $offset, $group );
}

/**
 * Prepend data to an existing item.
 *
 * This method should throw an error if it is used with compressed data. This is an expected behavior.
 * Memcached casts the value to be prepended to the initial value to the type of the initial value. Be
 * careful as this leads to unexpected behavior at times. For instance, prepending (float) 45.23 to
 * (int) 23 will result in 45, because the value is first combined (45.2323) then cast to "integer"
 * (the original value), which will be (int) 45. Due to how memcached treats types, the behavior has been
 * mimicked in the internal cache to produce similar results and improve consistency. It is recommend
 * that prepends only occur with data of the same type.
 *
 * @link http://www.php.net/manual/en/memcached.prepend.php
 *
 * @param string    $key    The key under which to store the value.
 * @param string    $value  Must be string as prepending mixed values is not well-defined.
 * @param string    $group  The group value prepended to the $key.
 * @return bool             Returns TRUE on success or FALSE on failure.
 */
function wp_cache_prepend( $key, $value, $group = '' ) {
	global $wp_object_cache;
	return $wp_object_cache->prepend( $key, $value, $group );
}

/**
 * Append data to an existing item by server key.
 *
 * This method should throw an error if it is used with compressed data. This is an expected behavior.
 * Memcached casts the value to be prepended to the initial value to the type of the initial value. Be
 * careful as this leads to unexpected behavior at times. For instance, prepending (float) 45.23 to
 * (int) 23 will result in 45, because the value is first combined (45.2323) then cast to "integer"
 * (the original value), which will be (int) 45. Due to how memcached treats types, the behavior has been
 * mimicked in the internal cache to produce similar results and improve consistency. It is recommend
 * that prepends only occur with data of the same type.
 *
 * @link http://www.php.net/manual/en/memcached.prependbykey.php
 *
 * @param string    $server_key     The key identifying the server to store the value on.
 * @param string    $key            The key under which to store the value.
 * @param string    $value          Must be string as prepending mixed values is not well-defined.
 * @param string    $group          The group value prepended to the $key.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_prepend_by_key( $server_key, $key, $value, $group = '' ) {
	global $wp_object_cache;
	return $wp_object_cache->prependByKey( $server_key, $key, $value, $group );
}

/**
 * Replaces a value in cache.
 *
 * This method is similar to "add"; however, is does not successfully set a value if
 * the object's key is not already set in cache.
 *
 * @link http://www.php.net/manual/en/memcached.replace.php
 *
 * @param string    $key        The key under which to store the value.
 * @param mixed     $value      The value to store.
 * @param string    $group      The group value appended to the $key.
 * @param int       $expiration The expiration time, defaults to 0.
 * @return bool                 Returns TRUE on success or FALSE on failure.
 */
function wp_cache_replace( $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->replace( $key, $value, $group, $expiration );
}

/**
 * Replaces a value in cache on a specific server.
 *
 * This method is similar to "addByKey"; however, is does not successfully set a value if
 * the object's key is not already set in cache.
 *
 * @link http://www.php.net/manual/en/memcached.addbykey.php
 *
 * @param string    $server_key     The key identifying the server to store the value on.
 * @param string    $key            The key under which to store the value.
 * @param mixed     $value          The value to store.
 * @param string    $group          The group value appended to the $key.
 * @param int       $expiration     The expiration time, defaults to 0.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_replace_by_key( $server_key, $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->replaceByKey( $server_key, $key, $value, $group, $expiration );
}

/**
 * Sets a value in cache.
 *
 * The value is set whether or not this key already exists in memcached.
 *
 * @link http://www.php.net/manual/en/memcached.set.php
 *
 * @param string    $key        The key under which to store the value.
 * @param mixed     $value      The value to store.
 * @param string    $group      The group value appended to the $key.
 * @param int       $expiration The expiration time, defaults to 0.
 * @return bool                 Returns TRUE on success or FALSE on failure.
 */
function wp_cache_set( $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->set( $key, $value, $group, $expiration );
}

/**
 * Sets a value in cache.
 *
 * The value is set whether or not this key already exists in memcached.
 *
 * @link http://www.php.net/manual/en/memcached.set.php
 *
 * @param string    $server_key     The key identifying the server to store the value on.
 * @param string    $key            The key under which to store the value.
 * @param mixed     $value          The value to store.
 * @param string    $group          The group value appended to the $key.
 * @param int       $expiration     The expiration time, defaults to 0.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_set_by_key( $server_key, $key, $value, $group = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->setByKey( $server_key, $key, $value, $group, $expiration );
}

/**
 * Set multiple values to cache at once.
 *
 * By sending an array of $items to this function, all values are saved at once to
 * memcached, reducing the need for multiple requests to memcached. The $items array
 * keys and values are what are stored to memcached. The keys in the $items array
 * are merged with the $groups array/string value via buildKeys to determine the
 * final key for the object.
 *
 * @param array         $items      An array of key/value pairs to store on the server.
 * @param string|array  $groups     Group(s) to merge with key(s) in $items.
 * @param int           $expiration The expiration time, defaults to 0.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_set_multi( $items, $groups = '', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->setMulti( $items, $groups, $expiration );
}

/**
 * Set multiple values to cache at once on specified server.
 *
 * By sending an array of $items to this function, all values are saved at once to
 * memcached, reducing the need for multiple requests to memcached. The $items array
 * keys and values are what are stored to memcached. The keys in the $items array
 * are merged with the $groups array/string value via buildKeys to determine the
 * final key for the object.
 *
 * @param string        $server_key The key identifying the server to store the value on.
 * @param array         $items      An array of key/value pairs to store on the server.
 * @param string|array  $groups     Group(s) to merge with key(s) in $items.
 * @param int           $expiration The expiration time, defaults to 0.
 * @return bool                     Returns TRUE on success or FALSE on failure.
 */
function wp_cache_set_multi_by_key( $server_key, $items, $groups = 'default', $expiration = 0 ) {
	global $wp_object_cache;
	return $wp_object_cache->setMultiByKey( $server_key, $items, $groups, $expiration );
}

/**
 * Set a Memcached option.
 *
 * @link http://www.php.net/manual/en/memcached.setoption.php
 *
 * @param int       $option Option name.
 * @param mixed     $value  Option value.
 * @return bool             Returns TRUE on success or FALSE on failure.
 */
function wp_cache_set_option( $option, $value ) {
	global $wp_object_cache;
	return $wp_object_cache->setOption( $option, $value );
}

/**
 * Switch blog prefix, which changes the cache that is accessed.
 *
 * @param  int     $blog_id    Blog to switch to.
 * @return void
 */
function wp_cache_switch_to_blog( $blog_id ) {
	global $wp_object_cache;
	return $wp_object_cache->switch_to_blog( $blog_id );
}


/**
 * Sets up Object Cache Global and assigns it.
 *
 * @global  WP_Object_Cache     $wp_object_cache    WordPress Object Cache
 * @return  void
 */
function wp_cache_init() {
	global $wp_object_cache;
	$wp_object_cache = new WP_Object_Cache();
}

/**
 * Adds a group or set of groups to the list of non-persistent groups.
 *
 * @param   string|array    $groups     A group or an array of groups to add.
 * @return  void
 */
function wp_cache_add_global_groups( $groups ) {
	global $wp_object_cache;
	$wp_object_cache->add_global_groups( $groups );
}

/**
 * Adds a group or set of groups to the list of non-Memcached groups.
 *
 * @param   string|array    $groups     A group or an array of groups to add.
 * @return  void
 */
function wp_cache_add_non_persistent_groups( $groups ) {
	global $wp_object_cache;
	$wp_object_cache->add_non_persistent_groups( $groups );
}

class WP_Object_Cache {

	/**
	 * Holds the Memcached object.
	 *
	 * @var Memcached
	 */
	public $m;

	/**
	 * Hold the Memcached server details.
	 *
	 * @var array
	 */
	public $servers;

	/**
	 * Holds the non-Memcached objects.
	 *
	 * @var array
	 */
	public $cache = array();

	/**
	 * List of global groups.
	 *
	 * @var array
	 */
	public $global_groups = array( 'users', 'userlogins', 'usermeta', 'site-options', 'site-lookup', 'blog-lookup', 'blog-details', 'rss' );

	/**
	 * List of groups not saved to Memcached.
	 *
	 * @var array
	 */
	public $no_mc_groups = array( 'comment', 'counts' );

	/**
	 * Prefix used for global groups.
	 *
	 * @var string
	 */
	public $global_prefix = '';

	/**
	 * Prefix used for non-global groups.
	 *
	 * @var string
	 */
	public $blog_prefix = '';

	/**
	 * Instantiate the Memcached class.
	 *
	 * Instantiates the Memcached class and returns adds the servers specified
	 * in the $memcached_servers global array.
	 *
	 * @link    http://www.php.net/manual/en/memcached.construct.php
	 *
	 * @param   null    $persistent_id      To create an instance that persists between requests, use persistent_id to specify a unique ID for the instance.
	 */
	public function __construct( $persistent_id = NULL ) {
		global $memcached_servers, $blog_id, $table_prefix;

		if ( is_null( $persistent_id ) || ! is_string( $persistent_id ) )
			$this->m = new Memcached();
		else
			$this->m = new Memcached( $persistent_id );

		if ( isset( $memcached_servers ) )
			$this->servers = $memcached_servers;
		else
			$this->servers = array( array( '127.0.0.1', 11211 ) );

		$this->addServers( $this->servers );

		/**
		 * This approach is borrowed from Sivel and Boren. Use the salt for easy cache invalidation and for
		 * multi single WP installs on the same server.
		 */
		if ( ! defined( 'WP_CACHE_KEY_SALT' ) )
			define( 'WP_CACHE_KEY_SALT', '' );

		// Assign global and blog prefixes for use with keys
		if ( function_exists( 'is_multisite' ) ) {
			$this->global_prefix = ( is_multisite() || defined( 'CUSTOM_USER_TABLE' ) && defined( 'CUSTOM_USER_META_TABLE' ) ) ? '' : $table_prefix;
			$this->blog_prefix = ( is_multisite() ? $blog_id : $table_prefix ) . ':';
		}

		// Setup cacheable values for handling expiration times
		$this->thirty_days = 60 * 60 * 24 * 30;
		$this->now         = time();
	}

	/**
	 * Adds a value to cache.
	 *
	 * If the specified key already exists, the value is not stored and the function
	 * returns false.
	 *
	 * @link    http://www.php.net/manual/en/memcached.add.php
	 *
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   bool        $byKey          True to store in internal cache by key; false to not store by key
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function add( $key, $value, $group = 'default', $expiration = 0, $server_key = '', $byKey = false ) {
		/*
		 * Ensuring that wp_suspend_cache_addition is defined before calling, because sometimes an advanced-cache.php
		 * file will load object-cache.php before wp-includes/functions.php is loaded. In those cases, if wp_cache_add
		 * is called in advanced-cache.php before any more of WordPress is loaded, we get a fatal error because
		 * wp_suspend_cache_addition will not be defined until wp-includes/functions.php is loaded.
		 */
		if ( function_exists( 'wp_suspend_cache_addition' ) && wp_suspend_cache_addition() ) {
			return false;
		}

		$derived_key = $this->buildKey( $key, $group );
		$expiration  = $this->sanitize_expiration( $expiration );

		// If group is a non-Memcached group, save to runtime cache, not Memcached
		if ( in_array( $group, $this->no_mc_groups ) ) {

			// Add does not set the value if the key exists; mimic that here
			if ( isset( $this->cache[$derived_key] ) )
				return false;

			$this->add_to_internal_cache( $derived_key, $value );

			return true;
		}

		// Save to Memcached
		if ( $byKey )
			$result = $this->m->addByKey( $server_key, $derived_key, $value, $expiration );
		else
			$result = $this->m->add( $derived_key, $value, $expiration );

		// Store in runtime cache if add was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->add_to_internal_cache( $derived_key, $value );

		return $result;
	}

	/**
	 * Adds a value to cache on a specific server.
	 *
	 * Using a server_key value, the object can be stored on a specified server as opposed
	 * to a random server in the stack. Note that this method will add the key/value to the
	 * _cache object as part of the runtime cache. It will add it to an array for the
	 * specified server_key.
	 *
	 * @link    http://www.php.net/manual/en/memcached.addbykey.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function addByKey( $server_key, $key, $value, $group = 'default', $expiration = 0 ) {
		return $this->add( $key, $value, $group, $expiration, $server_key, true );
	}

	/**
	 * Add a single server to the list of Memcached servers.
	 *
	 * @link http://www.php.net/manual/en/memcached.addserver.php
	 *
	 * @param   string      $host           The hostname of the memcache server.
	 * @param   int         $port           The port on which memcache is running.
	 * @param   int         $weight         The weight of the server relative to the total weight of all the servers in the pool.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function addServer( $host, $port, $weight = 0 ) {
		$host = is_string( $host ) ? $host : '127.0.0.1';
		$port = is_numeric( $port ) && $port > 0 ? $port : 11211;
		$weight = is_numeric( $weight ) && $weight > 0 ? $weight : 1;

		return $this->m->addServer( $host, $port, $weight );
	}

	/**
	 * Adds an array of servers to the pool.
	 *
	 * Each individual server in the array must include a domain and port, with an optional
	 * weight value: $servers = array( array( '127.0.0.1', 11211, 0 ) );
	 *
	 * @link    http://www.php.net/manual/en/memcached.addservers.php
	 *
	 * @param   array       $servers        Array of server to register.
	 * @return  bool                        True on success; false on failure.
	 */
	public function addServers( $servers ) {
		if ( ! is_object( $this->m ) )
			return false;

		return $this->m->addServers( $servers );
	}

	/**
	 * Append data to an existing item.
	 *
	 * This method should throw an error if it is used with compressed data. This
	 * is an expected behavior. Memcached casts the value to be appended to the initial value to the
	 * type of the initial value. Be careful as this leads to unexpected behavior at times. Due to
	 * how memcached treats types, the behavior has been mimicked in the internal cache to produce
	 * similar results and improve consistency. It is recommend that appends only occur with data of
	 * the same type.
	 *
	 * @link    http://www.php.net/manual/en/memcached.append.php
	 *
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          Must be string as appending mixed values is not well-defined.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   bool        $byKey          True to store in internal cache by key; false to not store by key
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function append( $key, $value, $group = 'default', $server_key = '', $byKey = false ) {
		if ( ! is_string( $value ) && ! is_int( $value ) && ! is_float( $value ) )
			return false;

		$derived_key = $this->buildKey( $key, $group );

		// If group is a non-Memcached group, append to runtime cache value, not Memcached
		if ( in_array( $group, $this->no_mc_groups ) ) {
			if ( ! isset( $this->cache[$derived_key] ) )
				return false;

			$combined = $this->combine_values( $this->cache[$derived_key], $value, 'app' );
			$this->add_to_internal_cache( $derived_key, $combined );
			return true;
		}

		// Append to Memcached value
		if ( $byKey )
			$result = $this->m->appendByKey( $server_key, $derived_key, $value );
		else
			$result = $this->m->append( $derived_key, $value );

		// Store in runtime cache if add was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() ) {
			$combined = $this->combine_values( $this->cache[$derived_key], $value, 'app' );
			$this->add_to_internal_cache( $derived_key, $combined );
		}

		return $result;
	}

	/**
	 * Append data to an existing item by server key.
	 *
	 * This method should throw an error if it is used with compressed data. This
	 * is an expected behavior. Memcached casts the value to be appended to the initial value to the
	 * type of the initial value. Be careful as this leads to unexpected behavior at times. Due to
	 * how memcached treats types, the behavior has been mimicked in the internal cache to produce
	 * similar results and improve consistency. It is recommend that appends only occur with data of
	 * the same type.
	 *
	 * @link    http://www.php.net/manual/en/memcached.appendbykey.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          Must be string as appending mixed values is not well-defined
	 * @param   string      $group          The group value appended to the $key.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function appendByKey( $server_key, $key, $value, $group = 'default' ) {
		return $this->append( $key, $value, $group, $server_key, true );
	}

	/**
	 * Performs a "check and set" to store data.
	 *
	 * The set will be successful only if the no other request has updated the value since it was fetched since
	 * this request.
	 *
	 * @link    http://www.php.net/manual/en/memcached.cas.php
	 *
	 * @param   float       $cas_token      Unique value associated with the existing item. Generated by memcached.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   bool        $byKey          True to store in internal cache by key; false to not store by key
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function cas( $cas_token, $key, $value, $group = 'default', $expiration = 0, $server_key = '', $byKey = false ) {
		$derived_key = $this->buildKey( $key, $group );
		$expiration  = $this->sanitize_expiration( $expiration );

		/**
		 * If group is a non-Memcached group, save to runtime cache, not Memcached. Note
		 * that since check and set cannot be emulated in the run time cache, this value
		 * operation is treated as a normal "add" for no_mc_groups.
		 */
		if ( in_array( $group, $this->no_mc_groups ) ) {
			$this->add_to_internal_cache( $derived_key, $value );
			return true;
		}

		// Save to Memcached
		if ( $byKey )
			$result = $this->m->casByKey( $cas_token, $server_key, $derived_key, $value, $expiration );
		else
			$result = $this->m->cas( $cas_token, $derived_key, $value, $expiration );

		// Store in runtime cache if cas was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->add_to_internal_cache( $derived_key, $value );

		return $result;
	}

	/**
	 * Performs a "check and set" to store data with a server key.
	 *
	 * The set will be successful only if the no other request has updated the value since it was fetched by
	 * this request.
	 *
	 * @link    http://www.php.net/manual/en/memcached.casbykey.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   float       $cas_token      Unique value associated with the existing item. Generated by memcached.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function casByKey( $cas_token, $server_key, $key, $value, $group = 'default', $expiration = 0 ) {
		return $this->cas( $cas_token, $key, $value, $group, $expiration, $server_key, true );
	}

	/**
	 * Decrement a numeric item's value.
	 *
	 * @link http://www.php.net/manual/en/memcached.decrement.php
	 *
	 * @param string    $key    The key under which to store the value.
	 * @param int       $offset The amount by which to decrement the item's value.
	 * @param string    $group  The group value appended to the $key.
	 * @return int|bool         Returns item's new value on success or FALSE on failure.
	 */
	public function decrement( $key, $offset = 1, $group = 'default' ) {
		$derived_key = $this->buildKey( $key, $group );

		// Decrement values in no_mc_groups
		if ( in_array( $group, $this->no_mc_groups ) ) {

			// Only decrement if the key already exists and value is 0 or greater (mimics memcached behavior)
			if ( isset( $this->cache[$derived_key] ) && $this->cache[$derived_key] >= 0 ) {

				// If numeric, subtract; otherwise, consider it 0 and do nothing
				if ( is_numeric( $this->cache[$derived_key] ) )
					$this->cache[$derived_key] -= (int) $offset;
				else
					$this->cache[$derived_key] = 0;

				// Returned value cannot be less than 0
				if ( $this->cache[$derived_key] < 0 )
					$this->cache[$derived_key] = 0;

				return $this->cache[$derived_key];
			} else {
				return false;
			}
		}

		$result = $this->m->decrement( $derived_key, $offset );

		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->add_to_internal_cache( $derived_key, $result );

		return $result;
	}

	/**
	 * Decrement a numeric item's value.
	 *
	 * Alias for $this->decrement. Other caching backends use this abbreviated form of the function. It *may* cause
	 * breakage somewhere, so it is nice to have. This function will also allow the core unit tests to pass.
	 *
	 * @param string    $key    The key under which to store the value.
	 * @param int       $offset The amount by which to decrement the item's value.
	 * @param string    $group  The group value appended to the $key.
	 * @return int|bool         Returns item's new value on success or FALSE on failure.
	 */
	public function decr( $key, $offset = 1, $group = 'default' ) {
		return $this->decrement( $key, $offset, $group );
	}

	/**
	 * Remove the item from the cache.
	 *
	 * Remove an item from memcached with identified by $key after $time seconds. The
	 * $time parameter allows an object to be queued for deletion without immediately
	 * deleting. Between the time that it is queued and the time it's deleted, add,
	 * replace, and get will fail, but set will succeed.
	 *
	 * @link http://www.php.net/manual/en/memcached.delete.php
	 *
	 * @param   string      $key        The key under which to store the value.
	 * @param   string      $group      The group value appended to the $key.
	 * @param   int         $time       The amount of time the server will wait to delete the item in seconds.
	 * @param   string      $server_key The key identifying the server to store the value on.
	 * @param   bool        $byKey      True to store in internal cache by key; false to not store by key
	 * @return  bool                    Returns TRUE on success or FALSE on failure.
	 */
	public function delete( $key, $group = 'default', $time = 0, $server_key = '', $byKey = false ) {
		$derived_key = $this->buildKey( $key, $group );

		// Remove from no_mc_groups array
		if ( in_array( $group, $this->no_mc_groups ) ) {
			if ( isset( $this->cache[$derived_key] ) )
				unset( $this->cache[$derived_key] );

			return true;
		}

		if ( $byKey )
			$result = $this->m->deleteByKey( $server_key, $derived_key, $time );
		else
			$result = $this->m->delete( $derived_key, $time );

		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			unset( $this->cache[$derived_key] );

		return $result;
	}

	/**
	 * Remove the item from the cache by server key.
	 *
	 * Remove an item from memcached with identified by $key after $time seconds. The
	 * $time parameter allows an object to be queued for deletion without immediately
	 * deleting. Between the time that it is queued and the time it's deleted, add,
	 * replace, and get will fail, but set will succeed.
	 *
	 * @link http://www.php.net/manual/en/memcached.deletebykey.php
	 *
	 * @param   string      $server_key The key identifying the server to store the value on.
	 * @param   string      $key        The key under which to store the value.
	 * @param   string      $group      The group value appended to the $key.
	 * @param   int         $time       The amount of time the server will wait to delete the item in seconds.
	 * @return  bool                    Returns TRUE on success or FALSE on failure.
	 */
	public function deleteByKey( $server_key, $key, $group = 'default', $time = 0 ) {
		return $this->delete( $key, $group, $time, $server_key, true );
	}

	/**
	 * Fetch the next result.
	 *
	 * @link http://www.php.net/manual/en/memcached.fetch.php
	 *
	 * @return array|bool   Returns the next result or FALSE on failure.
	 */
	public function fetch() {
		return $this->m->fetch();
	}

	/**
	 * Fetch all remaining results from the last request.
	 *
	 * @link http://www.php.net/manual/en/memcached.fetchall.php
	 *
	 * @return  array|bool          Returns the results or FALSE on failure.
	 */
	public function fetchAll() {
	 	return $this->m->fetchAll();
	}

	/**
	 * Invalidate all items in the cache.
	 *
	 * @link http://www.php.net/manual/en/memcached.flush.php
	 *
	 * @param   int     $delay      Number of seconds to wait before invalidating the items.
	 * @return  bool                Returns TRUE on success or FALSE on failure.
	 */
	public function flush( $delay = 0 ) {
		$result = $this->m->flush( $delay );

		// Only reset the runtime cache if memcached was properly flushed
		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->cache = array();

		return $result;
	}

	/**
	 * Retrieve object from cache.
	 *
	 * Gets an object from cache based on $key and $group. In order to fully support the $cache_cb and $cas_token
	 * parameters, the runtime cache is ignored by this function if either of those values are set. If either of
	 * those values are set, the request is made directly to the memcached server for proper handling of the
	 * callback and/or token. Note that the $cas_token variable cannot be directly passed to the function. The
	 * variable need to be first defined with a non null value.
	 *
	 * If using the $cache_cb argument, the new value will always have an expiration of time of 0 (forever). This
	 * is a limitation of the Memcached PECL extension.
	 *
	 * @link http://www.php.net/manual/en/memcached.get.php
	 *
	 * @param   string          $key        The key under which to store the value.
	 * @param   string          $group      The group value appended to the $key.
	 * @param   bool            $force      Whether or not to force a cache invalidation.
	 * @param   null|bool       $found      Variable passed by reference to determine if the value was found or not.
	 * @param   string          $server_key The key identifying the server to store the value on.
	 * @param   bool            $byKey      True to store in internal cache by key; false to not store by key
	 * @param   null|callable   $cache_cb   Read-through caching callback.
	 * @param   null|float      $cas_token  The variable to store the CAS token in.
	 * @return  bool|mixed                  Cached object value.
	 */
	public function get( $key, $group = 'default', $force = false, &$found = null, $server_key = '', $byKey = false, $cache_cb = NULL, &$cas_token = NULL ) {
		$derived_key = $this->buildKey( $key, $group );

		// Assume object is not found
		$found = false;

		// If either $cache_db, or $cas_token is set, must hit Memcached and bypass runtime cache
		if ( func_num_args() > 6 && ! in_array( $group, $this->no_mc_groups ) ) {
			if ( $byKey )
				$value = $this->m->getByKey( $server_key, $derived_key, $cache_cb, $cas_token );
			else
				$value = $this->m->get( $derived_key, $cache_cb, $cas_token );
		} else {
			if ( isset( $this->cache[$derived_key] ) ) {
				$found = true;
				return is_object( $this->cache[$derived_key] ) ? clone $this->cache[$derived_key] : $this->cache[$derived_key];
			} elseif ( in_array( $group, $this->no_mc_groups ) ) {
				return false;
			} else {
				if ( $byKey )
					$value = $this->m->getByKey( $server_key, $derived_key );
				else
					$value = $this->m->get( $derived_key );
			}
		}

		if ( Memcached::RES_SUCCESS === $this->getResultCode() ) {
			$this->add_to_internal_cache( $derived_key, $value );
			$found = true;
		}

		return is_object( $value ) ? clone $value : $value;
	}

	/**
	 * Retrieve object from cache from specified server.
	 *
	 * Gets an object from cache based on $key, $group and $server_key. In order to fully support the $cache_cb and $cas_token
	 * parameters, the runtime cache is ignored by this function if either of those values are set. If either of
	 * those values are set, the request is made directly to the memcached server for proper handling of the
	 * callback and/or token. Note that the $cas_token variable cannot be directly passed to the function. The
	 * variable need to be first defined with a non null value.
	 *
	 * If using the $cache_cb argument, the new value will always have an expiration of time of 0 (forever). This
	 * is a limitation of the Memcached PECL extension.
	 *
	 * @link http://www.php.net/manual/en/memcached.getbykey.php
	 *
	 * @param   string          $server_key The key identifying the server to store the value on.
	 * @param   string          $key        The key under which to store the value.
	 * @param   string          $group      The group value appended to the $key.
	 * @param   bool            $force      Whether or not to force a cache invalidation.
	 * @param   null|bool       $found      Variable passed by reference to determine if the value was found or not.
	 * @param   null|string     $cache_cb   Read-through caching callback.
	 * @param   null|float      $cas_token  The variable to store the CAS token in.
	 * @return  bool|mixed                  Cached object value.
	 */
	public function getByKey( $server_key, $key, $group = 'default', $force = false, &$found = null, $cache_cb = NULL, &$cas_token = NULL ) {
		/**
		 * Need to be careful how "get" is called. If you send $cache_cb, and $cas_token, it will hit memcached.
		 * Only send those args if they were sent to this function.
		 */
		if ( func_num_args() > 5 )
			return $this->get( $key, $group, $force, $found, $server_key, true, $cache_cb, $cas_token );
		else
			return $this->get( $key, $group, $force, $found, $server_key, true );
	}

	/**
	 * Request multiple keys without blocking.
	 *
	 * @link http://www.php.net/manual/en/memcached.getdelayed.php
	 *
	 * @param   string|array    $keys       Array or string of key(s) to request.
	 * @param   string|array    $groups     Array or string of group(s) for the key(s). See buildKeys for more on how these are handled.
	 * @param   bool            $with_cas   Whether to request CAS token values also.
	 * @param   null            $value_cb   The result callback or NULL.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function getDelayed( $keys, $groups = 'default', $with_cas = false, $value_cb = NULL ) {
		$derived_keys = $this->buildKeys( $keys, $groups );
		return $this->m->getDelayed( $derived_keys, $with_cas, $value_cb );
	}

	/**
	 * Request multiple keys without blocking from a specified server.
	 *
	 * @link http://www.php.net/manual/en/memcached.getdelayed.php
	 *
	 * @param   string          $server_key The key identifying the server to store the value on.
	 * @param   string|array    $keys       Array or string of key(s) to request.
	 * @param   string|array    $groups     Array or string of group(s) for the key(s). See buildKeys for more on how these are handled.
	 * @param   bool            $with_cas   Whether to request CAS token values also.
	 * @param   null            $value_cb   The result callback or NULL.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function getDelayedByKey( $server_key, $keys, $groups = 'default', $with_cas = false, $value_cb = NULL ) {
		$derived_keys = $this->buildKeys( $keys, $groups );
		return $this->m->getDelayedByKey( $server_key, $derived_keys, $with_cas, $value_cb );
	}

	/**
	 * Gets multiple values from memcached in one request.
	 *
	 * See the buildKeys method definition to understand the $keys/$groups parameters.
	 *
	 * @link http://www.php.net/manual/en/memcached.getmulti.php
	 *
	 * @param   array           $keys       Array of keys to retrieve.
	 * @param   string|array    $groups     If string, used for all keys. If arrays, corresponds with the $keys array.
	 * @param   string          $server_key The key identifying the server to store the value on.
	 * @param   null|array      $cas_tokens The variable to store the CAS tokens for the found items.
	 * @param   int             $flags      The flags for the get operation.
	 * @return  bool|array                  Returns the array of found items or FALSE on failure.
	 */
	public function getMulti( $keys, $groups = 'default', $server_key = '', &$cas_tokens = NULL, $flags = NULL ) {
		$derived_keys = $this->buildKeys( $keys, $groups );

		/**
		 * If either $cas_tokens, or $flags is set, must hit Memcached and bypass runtime cache. Note that
		 * this will purposely ignore no_mc_groups values as they cannot handle CAS tokens or the special
		 * flags; however, if the groups of groups contains a no_mc_group, this is bypassed.
		 */
		if ( func_num_args() > 3 && ! $this->contains_no_mc_group( $groups ) ) {
			if ( ! empty( $server_key ) )
				$values = $this->m->getMultiByKey( $server_key, $derived_keys, $cas_tokens, $flags );
			else
				$values = $this->m->getMulti( $derived_keys, $cas_tokens, $flags );
		} else {
			$values = array();
			$need_to_get = array();

			// Pull out values from runtime cache, or mark for retrieval
			foreach ( $derived_keys as $key ) {
				if ( isset( $this->cache[$key] ) )
					$values[$key] = $this->cache[$key];
				else
					$need_to_get[$key] = $key;
			}

			// Get those keys not found in the runtime cache
			if ( ! empty( $need_to_get ) ) {
				if ( ! empty( $server_key ) )
					$result = $this->m->getMultiByKey( $server_key, array_keys( $need_to_get ) );
				else
					$result = $this->m->getMulti( array_keys( $need_to_get ) );
			}

			// Merge with values found in runtime cache
			if ( isset( $result ) && Memcached::RES_SUCCESS === $this->getResultCode() )
				$values = array_merge( $values, $result );

			// If order should be preserved, reorder now
			if ( ! empty( $need_to_get ) && $flags === Memcached::GET_PRESERVE_ORDER ) {
				$ordered_values = array();

				foreach ( $derived_keys as $key ) {
					if ( isset( $values[$key] ) )
						$ordered_values[$key] = $values[$key];
				}

				$values = $ordered_values;
				unset( $ordered_values );
			}
		}

		// Add the values to the runtime cache
		$this->cache = array_merge( $this->cache, $values );

		return $values;
	}

	/**
	 * Gets multiple values from memcached in one request by specified server key.
	 *
	 * See the buildKeys method definition to understand the $keys/$groups parameters.
	 *
	 * @link http://www.php.net/manual/en/memcached.getmultibykey.php
	 *
	 * @param   string          $server_key The key identifying the server to store the value on.
	 * @param   array           $keys       Array of keys to retrieve.
	 * @param   string|array    $groups     If string, used for all keys. If arrays, corresponds with the $keys array.
	 * @param   null|array      $cas_tokens The variable to store the CAS tokens for the found items.
	 * @param   int             $flags      The flags for the get operation.
	 * @return  bool|array                  Returns the array of found items or FALSE on failure.
	 */
	public function getMultiByKey( $server_key, $keys, $groups = 'default', &$cas_tokens = NULL, $flags = NULL ) {
		/**
		 * Need to be careful how "getMulti" is called. If you send $cache_cb, and $cas_token, it will hit memcached.
		 * Only send those args if they were sent to this function.
		 */
		if ( func_num_args() > 3 )
			return $this->getMulti( $keys, $groups, $server_key, $cas_tokens, $flags );
		else
			return $this->getMulti( $keys, $groups, $server_key );
	}

	/**
	 * Retrieve a Memcached option value.
	 *
	 * @link http://www.php.net/manual/en/memcached.getoption.php
	 *
	 * @param   int         $option     One of the Memcached::OPT_* constants.
	 * @return  mixed                   Returns the value of the requested option, or FALSE on error.
	 */
	public function getOption( $option ) {
		return $this->m->getOption( $option );
	}

	/**
	 * Return the result code of the last option.
	 *
	 * @link http://www.php.net/manual/en/memcached.getresultcode.php
	 *
	 * @return  int     Result code of the last Memcached operation.
	 */
	public function getResultCode() {
 	    return $this->m->getResultCode();
	}

	/**
	 * Return the message describing the result of the last operation.
	 *
	 * @link    http://www.php.net/manual/en/memcached.getresultmessage.php
	 *
	 * @return  string      Message describing the result of the last Memcached operation.
	 */
	public function getResultMessage() {
   	    return $this->m->getResultMessage();
	}

	/**
	 * Get server information by key.
	 *
	 * @link    http://www.php.net/manual/en/memcached.getserverbykey.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @return  array                       Array with host, post, and weight on success, FALSE on failure.
	 */
	public function getServerByKey( $server_key ) {
		return $this->m->getServerByKey( $server_key );
	}

	/**
	 * Get the list of servers in the pool.
	 *
	 * @link    http://www.php.net/manual/en/memcached.getserverlist.php
	 *
	 * @return  array       The list of all servers in the server pool.
	 */
	public function getServerList() {
		return $this->m->getServerList();
	}

	/**
     * Get server pool statistics.
	 *
	 * @link    http://www.php.net/manual/en/memcached.getstats.php
	 *
	 * @return  array       Array of server statistics, one entry per server.
	 */
	public function getStats() {
		return $this->m->getStats();
	}

	/**
	 * Get server pool memcached version information.
	 *
	 * @link    http://www.php.net/manual/en/memcached.getversion.php
	 *
	 * @return  array       Array of server versions, one entry per server.
	 */
	public function getVersion() {
		return $this->m->getVersion();
	}

	/**
	 * Increment a numeric item's value.
	 *
	 * @link http://www.php.net/manual/en/memcached.increment.php
	 *
	 * @param   string      $key        The key under which to store the value.
	 * @param   int         $offset     The amount by which to increment the item's value.
	 * @param   string      $group      The group value appended to the $key.
	 * @return  int|bool                Returns item's new value on success or FALSE on failure.
	 */
	public function increment( $key, $offset = 1, $group = 'default' ) {
		$derived_key = $this->buildKey( $key, $group );

		// Increment values in no_mc_groups
		if ( in_array( $group, $this->no_mc_groups ) ) {

			// Only increment if the key already exists and the number is currently 0 or greater (mimics memcached behavior)
			if ( isset( $this->cache[$derived_key] ) &&  $this->cache[$derived_key] >= 0 ) {

				// If numeric, add; otherwise, consider it 0 and do nothing
				if ( is_numeric( $this->cache[$derived_key] ) )
					$this->cache[$derived_key] += (int) $offset;
				else
					$this->cache[$derived_key] = 0;

				// Returned value cannot be less than 0
				if ( $this->cache[$derived_key] < 0 )
					$this->cache[$derived_key] = 0;

				return $this->cache[$derived_key];
			} else {
				return false;
			}
		}

		$result = $this->m->increment( $derived_key, $offset );

		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->add_to_internal_cache( $derived_key, $result );

		return $result;
	}

	/**
	 * Synonymous with $this->incr.
	 *
	 * Certain plugins expect an "incr" method on the $wp_object_cache object (e.g., Batcache). Since the original
	 * version of this library matched names to the memcached methods, the "incr" method was missing. Adding this
	 * method restores compatibility with plugins expecting an "incr" method.
	 *
	 * @param   string      $key        The key under which to store the value.
	 * @param   int         $offset     The amount by which to increment the item's value.
	 * @param   string      $group      The group value appended to the $key.
	 * @return  int|bool                Returns item's new value on success or FALSE on failure.
	 */
	public function incr( $key, $offset = 1, $group = 'default' ) {
		return $this->increment( $key, $offset, $group );
	}

	/**
	 * Prepend data to an existing item.
	 *
	 * This method should throw an error if it is used with compressed data. This is an expected behavior.
	 * Memcached casts the value to be prepended to the initial value to the type of the initial value. Be
	 * careful as this leads to unexpected behavior at times. For instance, prepending (float) 45.23 to
	 * (int) 23 will result in 45, because the value is first combined (45.2323) then cast to "integer"
	 * (the original value), which will be (int) 45. Due to how memcached treats types, the behavior has been
	 * mimicked in the internal cache to produce similar results and improve consistency. It is recommend
	 * that prepends only occur with data of the same type.
	 *
	 * @link    http://www.php.net/manual/en/memcached.prepend.php
	 *
	 * @param   string    $key          The key under which to store the value.
	 * @param   string    $value        Must be string as prepending mixed values is not well-defined.
	 * @param   string    $group        The group value prepended to the $key.
	 * @param   string    $server_key   The key identifying the server to store the value on.
	 * @param   bool      $byKey        True to store in internal cache by key; false to not store by key
	 * @return  bool                    Returns TRUE on success or FALSE on failure.
	 */
	public function prepend( $key, $value, $group = 'default', $server_key = '', $byKey = false ) {
		if ( ! is_string( $value ) && ! is_int( $value ) && ! is_float( $value ) )
			return false;

		$derived_key = $this->buildKey( $key, $group );

		// If group is a non-Memcached group, prepend to runtime cache value, not Memcached
		if ( in_array( $group, $this->no_mc_groups ) ) {
			if ( ! isset( $this->cache[$derived_key] ) )
				return false;

			$combined = $this->combine_values( $this->cache[$derived_key], $value, 'pre' );
			$this->add_to_internal_cache( $derived_key, $combined );
			return true;
		}

		// Append to Memcached value
		if ( $byKey )
			$result = $this->m->prependByKey( $server_key, $derived_key, $value );
		else
			$result = $this->m->prepend( $derived_key, $value );

		// Store in runtime cache if add was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() ) {
			$combined = $this->combine_values( $this->cache[$derived_key], $value, 'pre' );
			$this->add_to_internal_cache( $derived_key, $combined );
		}

		return $result;
	}

	/**
	 * Append data to an existing item by server key.
	 *
	 * This method should throw an error if it is used with compressed data. This is an expected behavior.
	 * Memcached casts the value to be prepended to the initial value to the type of the initial value. Be
	 * careful as this leads to unexpected behavior at times. For instance, prepending (float) 45.23 to
	 * (int) 23 will result in 45, because the value is first combined (45.2323) then cast to "integer"
	 * (the original value), which will be (int) 45. Due to how memcached treats types, the behavior has been
	 * mimicked in the internal cache to produce similar results and improve consistency. It is recommend
	 * that prepends only occur with data of the same type.
	 *
	 * @link    http://www.php.net/manual/en/memcached.prependbykey.php
	 *
	 * @param   string    $server_key   The key identifying the server to store the value on.
	 * @param   string    $key          The key under which to store the value.
	 * @param   string    $value        Must be string as prepending mixed values is not well-defined.
	 * @param   string    $group        The group value prepended to the $key.
	 * @return  bool                    Returns TRUE on success or FALSE on failure.
	 */
	public function prependByKey( $server_key, $key, $value, $group = 'default' ) {
		return $this->prepend( $key, $value, $group, $server_key, true );
	}

	/**
	 * Replaces a value in cache.
	 *
	 * This method is similar to "add"; however, is does not successfully set a value if
	 * the object's key is not already set in cache.
	 *
	 * @link    http://www.php.net/manual/en/memcached.replace.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   bool        $byKey          True to store in internal cache by key; false to not store by key
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function replace( $key, $value, $group = 'default', $expiration = 0, $server_key = '', $byKey = false ) {
		$derived_key = $this->buildKey( $key, $group );
		$expiration  = $this->sanitize_expiration( $expiration );

		// If group is a non-Memcached group, save to runtime cache, not Memcached
		if ( in_array( $group, $this->no_mc_groups ) ) {

			// Replace won't save unless the key already exists; mimic this behavior here
			if ( ! isset( $this->cache[$derived_key] ) )
				return false;

			$this->cache[$derived_key] = $value;
			return true;
		}

		// Save to Memcached
		if ( $byKey )
			$result = $this->m->replaceByKey( $server_key, $derived_key, $value, $expiration );
		else
			$result = $this->m->replace( $derived_key, $value, $expiration );

		// Store in runtime cache if add was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->add_to_internal_cache( $derived_key, $value );

		return $result;
	}

	/**
	 * Replaces a value in cache on a specific server.
	 *
	 * This method is similar to "addByKey"; however, is does not successfully set a value if
	 * the object's key is not already set in cache.
	 *
	 * @link    http://www.php.net/manual/en/memcached.addbykey.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function replaceByKey( $server_key, $key, $value, $group = 'default', $expiration = 0 ) {
		return $this->replace( $key, $value, $group, $expiration, $server_key, true );
	}

	/**
	 * Sets a value in cache.
	 *
	 * The value is set whether or not this key already exists in memcached.
	 *
	 * @link http://www.php.net/manual/en/memcached.set.php
	 *
	 * @param   string      $key        The key under which to store the value.
	 * @param   mixed       $value      The value to store.
	 * @param   string      $group      The group value appended to the $key.
	 * @param   int         $expiration The expiration time, defaults to 0.
	 * @param   string      $server_key The key identifying the server to store the value on.
	 * @param   bool        $byKey      True to store in internal cache by key; false to not store by key
	 * @return  bool                    Returns TRUE on success or FALSE on failure.
	 */
	public function set( $key, $value, $group = 'default', $expiration = 0, $server_key = '', $byKey = false ) {
		$derived_key = $this->buildKey( $key, $group );
		$expiration  = $this->sanitize_expiration( $expiration );

		// If group is a non-Memcached group, save to runtime cache, not Memcached
		if ( in_array( $group, $this->no_mc_groups ) ) {
			$this->add_to_internal_cache( $derived_key, $value );
			return true;
		}

		// Save to Memcached
		if ( $byKey ) {
			$result = $this->m->setByKey( $server_key, $derived_key, $value, $expiration );
		} else {
			$result = $this->m->set( $derived_key, $value, $expiration );
		}

		// Store in runtime cache if add was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->add_to_internal_cache( $derived_key, $value );

		return $result;
	}

	/**
	 * Sets a value in cache on a specific server.
	 *
	 * The value is set whether or not this key already exists in memcached.
	 *
	 * @link    http://www.php.net/manual/en/memcached.setbykey.php
	 *
	 * @param   string      $server_key     The key identifying the server to store the value on.
	 * @param   string      $key            The key under which to store the value.
	 * @param   mixed       $value          The value to store.
	 * @param   string      $group          The group value appended to the $key.
	 * @param   int         $expiration     The expiration time, defaults to 0.
	 * @return  bool                        Returns TRUE on success or FALSE on failure.
	 */
	public function setByKey( $server_key, $key, $value, $group = 'default', $expiration = 0 ) {
		return $this->set( $key, $value, $group, $expiration, $server_key, true );
	}

	/**
	 * Set multiple values to cache at once.
	 *
	 * By sending an array of $items to this function, all values are saved at once to
	 * memcached, reducing the need for multiple requests to memcached. The $items array
	 * keys and values are what are stored to memcached. The keys in the $items array
	 * are merged with the $groups array/string value via buildKeys to determine the
	 * final key for the object.
	 *
	 * @link    http://www.php.net/manual/en/memcached.setmulti.php
	 *
	 * @param   array           $items          An array of key/value pairs to store on the server.
	 * @param   string|array    $groups         Group(s) to merge with key(s) in $items.
	 * @param   int             $expiration     The expiration time, defaults to 0.
	 * @param   string          $server_key     The key identifying the server to store the value on.
	 * @param   bool            $byKey          True to store in internal cache by key; false to not store by key
	 * @return  bool                            Returns TRUE on success or FALSE on failure.
	 */
	public function setMulti( $items, $groups = 'default', $expiration = 0, $server_key = '', $byKey = false ) {
		// Build final keys and replace $items keys with the new keys
		$derived_keys  = $this->buildKeys( array_keys( $items ), $groups );
		$expiration    = $this->sanitize_expiration( $expiration );
		$derived_items = array_combine( $derived_keys, $items );

		// Do not add to memcached if in no_mc_groups
		foreach ( $derived_items as $derived_key => $value ) {

			// Get the individual item's group
			$key_pieces = explode( ':', $derived_key );

			// If group is a non-Memcached group, save to runtime cache, not Memcached
			if ( in_array( $key_pieces[1], $this->no_mc_groups ) ) {
				$this->add_to_internal_cache( $derived_key, $value );
				unset( $derived_items[$derived_key] );
			}
		}

		// Save to memcached
		if ( $byKey )
			$result = $this->m->setMultiByKey( $server_key, $derived_items, $expiration );
		else
			$result = $this->m->setMulti( $derived_items, $expiration );

		// Store in runtime cache if add was successful
		if ( Memcached::RES_SUCCESS === $this->getResultCode() )
			$this->cache = array_merge( $this->cache, $derived_items );

		return $result;
	}

	/**
	 * Set multiple values to cache at once on specified server.
	 *
	 * By sending an array of $items to this function, all values are saved at once to
	 * memcached, reducing the need for multiple requests to memcached. The $items array
	 * keys and values are what are stored to memcached. The keys in the $items array
	 * are merged with the $groups array/string value via buildKeys to determine the
	 * final key for the object.
	 *
	 * @link    http://www.php.net/manual/en/memcached.setmultibykey.php
	 *
	 * @param   string          $server_key     The key identifying the server to store the value on.
	 * @param   array           $items          An array of key/value pairs to store on the server.
	 * @param   string|array    $groups         Group(s) to merge with key(s) in $items.
	 * @param   int             $expiration     The expiration time, defaults to 0.
	 * @return  bool                            Returns TRUE on success or FALSE on failure.
	 */
	public function setMultiByKey( $server_key, $items, $groups = 'default', $expiration = 0 ) {
		return $this->setMulti( $items, $groups, $expiration, $server_key, true );
	}

	/**
	 * Set a Memcached option.
	 *
	 * @link    http://www.php.net/manual/en/memcached.setoption.php
	 *
	 * @param   int         $option     Option name.
	 * @param   mixed       $value      Option value.
	 * @return  bool                Returns TRUE on success or FALSE on failure.
	 */
	public function setOption( $option, $value ) {
		return $this->m->setOption( $option, $value );
	}

	/**
	 * Builds a key for the cached object using the blog_id, key, and group values.
	 *
	 * @author  Ryan Boren   This function is inspired by the original WP Memcached Object cache.
	 * @link    http://wordpress.org/extend/plugins/memcached/
	 *
	 * @param   string      $key        The key under which to store the value.
	 * @param   string      $group      The group value appended to the $key.
	 * @return  string
	 */
	public function buildKey( $key, $group = 'default' ) {
		if ( empty( $group ) )
			$group = 'default';

		if ( false !== array_search( $group, $this->global_groups ) )
			$prefix = $this->global_prefix;
		else
			$prefix = $this->blog_prefix;

		return preg_replace( '/\s+/', '', WP_CACHE_KEY_SALT . "$prefix$group:$key" );
	}

	/**
	 * Creates an array of keys from passed key(s) and group(s).
	 *
	 * This function takes a string or array of key(s) and group(s) and combines them into a single dimensional
	 * array that merges the keys and groups. If the same number of keys and groups exist, the final keys will
	 * append $groups[n] to $keys[n]. If there are more keys than groups and the $groups parameter is an array,
	 * $keys[n] will be combined with $groups[n] until $groups runs out of values. 'default' will be used for remaining
	 * values. If $keys is an array and $groups is a string, all final values will append $groups to $keys[n].
	 * If both values are strings, they will be combined into a single string. Note that if more $groups are received
	 * than $keys, the method will return an empty array. This method is primarily a helper method for methods
	 * that call memcached with an array of keys.
	 *
	 * @param   string|array    $keys       Key(s) to merge with group(s).
	 * @param   string|array    $groups     Group(s) to merge with key(s).
	 * @return  array                       Array that combines keys and groups into a single set of memcached keys.
	 */
	public function buildKeys( $keys, $groups = 'default' ) {
		$derived_keys = array();

		// If strings sent, convert to arrays for proper handling
		if ( ! is_array( $groups ) )
			$groups = (array) $groups;

		if ( ! is_array( $keys ) )
			$keys = (array) $keys;

		// If we have equal numbers of keys and groups, merge $keys[n] and $group[n]
		if ( count( $keys ) == count( $groups ) ) {
			for ( $i = 0; $i < count( $keys ); $i++ ) {
				$derived_keys[] = $this->buildKey( $keys[$i], $groups[$i] );
			}

		// If more keys are received than groups, merge $keys[n] and $group[n] until no more group are left; remaining groups are 'default'
		} elseif ( count( $keys ) > count( $groups ) ) {
			for ( $i = 0; $i < count( $keys ); $i++ ) {
				if ( isset( $groups[$i] ) )
					$derived_keys[] = $this->buildKey( $keys[$i], $groups[$i] );
				elseif ( count( $groups ) == 1 )
					$derived_keys[] = $this->buildKey( $keys[$i], $groups[0] );
				else
					$derived_keys[] = $this->buildKey( $keys[$i], 'default' );
			}
		}

		return $derived_keys;
	}

	/**
	 * Ensure that a proper expiration time is set.
	 *
	 * Memcached treats any value over 30 days as a timestamp. If a developer sets the expiration for greater than 30
	 * days or less than the current timestamp, the timestamp is in the past and the value isn't cached. This function
	 * detects values in that range and corrects them.
	 *
	 * @param  string|int    $expiration    The dirty expiration time.
	 * @return string|int                   The sanitized expiration time.
	 */
	public function sanitize_expiration( $expiration ) {
		if ( $expiration > $this->thirty_days && $expiration <= $this->now ) {
			$expiration = $expiration + $this->now;
		}

		return $expiration;
	}

	/**
	 * Concatenates two values and casts to type of the first value.
	 *
	 * This is used in append and prepend operations to match how these functions are handled
	 * by memcached. In both cases, whichever value is the original value in the combined value
	 * will dictate the type of the combined value.
	 *
	 * @param   mixed       $original   Original value that dictates the combined type.
	 * @param   mixed       $pended     Value to combine with original value.
	 * @param   string      $direction  Either 'pre' or 'app'.
	 * @return  mixed                   Combined value casted to the type of the first value.
	 */
	public function combine_values( $original, $pended, $direction ) {
		$type = gettype( $original );

		// Combine the values based on direction of the "pend"
		if ( 'pre' == $direction )
			$combined = $pended . $original;
		else
			$combined = $original . $pended;

		// Cast type of combined value
		settype( $combined, $type );

		return $combined;
	}

	/**
	 * Simple wrapper for saving object to the internal cache.
	 *
	 * @param   string      $derived_key    Key to save value under.
	 * @param   mixed       $value          Object value.
	 */
	public function add_to_internal_cache( $derived_key, $value ) {
		if ( is_object( $value ) ) {
			$value = clone $value;
		}

		$this->cache[$derived_key] = $value;
	}

	/**
	 * Determines if a no_mc_group exists in a group of groups.
	 *
	 * @param   mixed   $groups     The groups to search.
	 * @return  bool                True if a no_mc_group is present; false if a no_mc_group is not present.
	 */
	public function contains_no_mc_group( $groups ) {
		if ( is_scalar( $groups ) )
			return in_array( $groups, $this->no_mc_groups );

		if ( ! is_array( $groups ) )
			return false;

		foreach ( $groups as $group ) {
			if ( in_array( $group, $this->no_mc_groups ) )
				return true;
		}

		return false;
	}

	/**
	 * Add global groups.
	 *
	 * @author  Ryan Boren   This function comes straight from the original WP Memcached Object cache
	 * @link    http://wordpress.org/extend/plugins/memcached/
	 *
	 * @param   array       $groups     Array of groups.
	 * @return  void
	 */
	public function add_global_groups( $groups ) {
		if ( ! is_array( $groups ) )
			$groups = (array) $groups;

		$this->global_groups = array_merge( $this->global_groups, $groups);
		$this->global_groups = array_unique( $this->global_groups );
	}

	/**
	 * Add non-persistent groups.
	 *
	 * @author  Ryan Boren   This function comes straight from the original WP Memcached Object cache
	 * @link    http://wordpress.org/extend/plugins/memcached/
	 *
	 * @param   array       $groups     Array of groups.
	 * @return  void
	 */
	public function add_non_persistent_groups( $groups ) {
		if ( ! is_array( $groups ) )
			$groups = (array) $groups;

		$this->no_mc_groups = array_merge( $this->no_mc_groups, $groups );
		$this->no_mc_groups = array_unique( $this->no_mc_groups );
	}

	/**
	 * Get a value specifically from the internal, run-time cache, not memcached.
	 *
	 * @param   int|string  $key        Key value.
	 * @param   int|string  $group      Group that the value belongs to.
	 * @return  bool|mixed              Value on success; false on failure.
	 */
	public function get_from_runtime_cache( $key, $group ) {
		$derived_key = $this->buildKey( $key, $group );

		if ( isset( $this->cache[$derived_key] ) )
			return $this->cache[$derived_key];

		return false;
	}

	/**
	 * Switch blog prefix, which changes the cache that is accessed.
	 *
	 * @param  int     $blog_id    Blog to switch to.
	 * @return void
	 */
	public function switch_to_blog( $blog_id ) {
		global $table_prefix;
		$blog_id           = (int) $blog_id;
		$this->blog_prefix = ( is_multisite() ? $blog_id : $table_prefix ) . ':';
	}
}
