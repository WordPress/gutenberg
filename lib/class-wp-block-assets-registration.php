<?php

/**
 * Default class for registering a block's assets.
 *
 * Can be replaced via the "?" filter,
 *
 * @since 2.x.x
 */
class WP_Block_Assets_Registration implements WP_Registers_Block_Assets {

    /**
     * The block
     *
     * @since 2.x.x
     *
     * @var WP_Block_Type
     */
    protected $block;

    /**
     * WP_Block_Asset_Registration constructor.
     * @param WP_Block_Type $block A block
     */
    public function __construct( WP_Block_Type $block){
        $this->block = $block;
    }

    /** @inheritdoc */
    public function add_hooks(){
        add_action( 'enqueue_block_editor_assets', array( $this, 'register_editor_script' ) );
        add_action( 'enqueue_block_editor_assets', array( $this, 'register_editor_style' ) );

        add_action( 'enqueue_block_assets', array( $this, 'register_script' ) );
        add_action( 'enqueue_block_assets', array( $this, 'register_style' ) );
    }

    /** @inheritdoc */
    public function remove_hooks(){
        remove_action( 'enqueue_block_editor_assets', array( $this, 'register_editor_script' ) );
        remove_action( 'enqueue_block_editor_assets', array( $this, 'register_editor_style' ) );

        remove_action( 'enqueue_block_assets', array( $this, 'register_script' ) );
        remove_action( 'enqueue_block_assets', array( $this, 'register_style' ) );
    }

    /** @inheritdoc */
    public function register_editor_script(){
        if( $this->block->editor_script ){
            wp_register_script( $this->block->editor_script, $this->get_url_for_asset( 'editor_script' ) );
        }
    }

    /** @inheritdoc */
    public function register_editor_style(){
        if( $this->block->editor_style ){
            wp_register_style( $this->block->editor_style, $this->get_url_for_asset( 'editor_style' ) );
        }
    }

    /** @inheritdoc */
    public function register_script(){
        if( $this->block->script ){
            wp_register_script( $this->block->script, $this->get_url_for_asset( 'script' ) );
        }
    }

    /** @inheritdoc */
    public function register_style(){
        if( $this->block->style ){
            wp_register_style( $this->block->style, $this->get_url_for_asset( 'style' ) );
        }
    }

    /**
     * Get the URL for an asset
     *
     * @since 2.x.x
     *
     * @param string $asset_type Asset type style|script|editor_script|editor_style
     * @return string
     */
    protected function get_url_for_asset( $asset_type ){

        if ( $this->block->$asset_type ) {
            //WP_Block_Type doesn't know enough about assets yet for this to be done smartly.
            $url = ''; //?

            /**
             * Filter the Url for a block's asset
             *
             * @since 2.x.x
             *
             * @param string $url Asset url
             * @param string $asset_type Asset type style|script|editor_script|editor_style
             * @param WP_Block_Type $block The block whose assets are being registered.
             */
            $url = apply_filters( 'block_asset_url', $url, $asset_type, $this->block );
            return filter_var( $url, FILTER_VALIDATE_URL ) ? $url : '';
        }

        return '';

    }

}