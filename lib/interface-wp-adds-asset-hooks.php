<?php

/**
 * Interface WP_Adds_Asset_Hooks
 *
 * @since 2.x.x
 *
 * Interface that objects responsible for registering or enqueueing scripts should implement.
 */
interface WP_Adds_Asset_Hooks{
    /**
     * Add all hooks needed by this object.
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function add_hooks();

    /**
     * Removes all hooks added by this object's add_hooks method
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function remove_hooks();
}