<?php

/**
 * Class WP_Block_Asset_Factory
 *
 * @since 2.x.x
 *
 * Responsible for creating objects that handle loading block assets
 */
class WP_Block_Asset_Factory{

    /**
     * Creates objects that register's block assets
     *
     * @since 2.x.x
     *
     * @param WP_Block_Type $block
     * @return WP_Registers_Block_Assets
     */
    public function registration( WP_Block_Type $block ){
        /**
         * Runs before each block's assets are rendered
         *
         * @since 2.x.x
         *
         * @param null|WP_Registers_Block_Assets $register Return an object
         *
         */
        $register = apply_filters( 'pre_register_block_assets', null, $block, $this );

        if ( ! is_a( $register, WP_Registers_Block_Assets::class )) {
            $register = new WP_Block_Assets_Registration($block);
        }

        /**
         * Runs before each object is instantiated, before hooks are added.
         *
         * @since 2.x.x
         */
        do_action( 'block_assets_registered', $register, $this );
        return $register;
    }

    /**
     * Creates objects that enqueue block assets
     *
     * @since 2.x.x
     *
     * @param WP_Block_Type $block Block to enqueue assets for
     * @return WP_Enqueues_Block_Assets
     */
    public function enqueue( WP_Block_Type $block ){
        /**
         * Runs before each block's assets are enqueued
         *
         * @since 2.x.x
         *
         * @param null|WP_Enqueues_Block_Assets $enqueue Return an object
         *
         */
        $enqueue = apply_filters( 'pre_enqueue_block_assets', null, $block, $this );

        if ( ! is_a( $enqueue, WP_Enqueues_Block_Assets::class )) {
            $enqueue = new WP_Block_Assets_Enqueue($block);
        }

        /**
         * Runs after object is instantiated, before hooks are added.
         *
         * @since 2.x.x
         */
        do_action( 'block_assets_enqueue', $enqueue );
        return $enqueue;
    }

}