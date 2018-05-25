<?php

/**
 * Default class for enqueuing a block's assets.
 *
 * Can be replaced via the "?" filter,
 *
 * @since 2.x.x
 */
class WP_Block_Assets_Enqueue implements WP_Enqueues_Block_Assets {

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
        //?
    }

    /** @inheritdoc */
    public function remove_hooks(){
       //?
    }

    /** @inheritdoc */
    public function enqueue_editor_script(){
        if( $this->block->editor_script ){
            wp_enqueue_script( $this->block->editor_script );
        }
    }

    /** @inheritdoc */
    public function enqueue_editor_style(){
        if( $this->block->editor_style ){
            wp_enqueue_style( $this->block->editor_style );
        }
    }

    /** @inheritdoc */
    public function enqueue_script(){
        if( $this->block->script ){
            wp_enqueue_script( $this->block->script );
        }
    }

    /** @inheritdoc */
    public function enqueue_style(){
        if( $this->block->style ){
            wp_enqueue_style( $this->block->style );
        }
    }


}