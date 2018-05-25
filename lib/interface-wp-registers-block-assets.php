<?php

/**
 * Interface WP_Registers_Block_Assets
 *
 * @since 2.x.x
 *
 * Objects responsible for registering block assets should implement this.
 *
 * @see wp_register_script()
 * @see wp_register_style()
 */
interface WP_Registers_Block_Assets extends WP_Adds_Asset_Hooks {

    /**
     * Register the editor JavaScript
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function register_editor_script();

    /**
     * Register the editor CSS
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function register_editor_style();

    /**
     * Register the front-end JavaScript
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function register_script();

    /**
     * Register the front-end CSS
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function register_style();
}