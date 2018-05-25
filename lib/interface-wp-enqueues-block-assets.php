<?php
/**
 * Interface WP_Enqueues_Block_Assets
 *
 * @since 2.x.x
 *
 * Objects responsible for enqueuing block assets should implement this.
 *
 * @see wp_enqueue_script()
 * @see wp_enqueue_style()
 */
interface WP_Enqueues_Block_Assets extends WP_Adds_Asset_Hooks {

    /**
     * Enqueue the editor JavaScript
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function enqueue_editor_script();

    /**
     * Enqueue the editor CSS
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function enqueue_editor_style();

    /**
     * Enqueue the front-end JavaScript
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function enqueue_script();

    /**
     * Enqueue the front-end CSS
     *
     * @since 2.x.x
     *
     * @return void
     */
    public function enqueue_style();
}