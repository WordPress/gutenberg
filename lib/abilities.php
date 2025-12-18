<?php
require_once __DIR__ . '/abilities/posts.php';

function _gutenberg_register_core_ability_categories() {
    // If the category already exists, unregister it first, so we can override it.
    if ( wp_has_ability_category( 'post' ) ) {
        wp_unregister_ability_category( 'post' );
    }

    wp_register_ability_category(
        'post',
        array(
            'label'       => 'Post',
            'description' => 'Abilities related to the creation and management of posts of all types.',
        )
    );
}

function _gutenberg_register_core_abilities() {
    _gutenberg_register_core_posts_abilities();
}

// With a priority of 11 to ensure Gutenberg abilities are registered after core ones.
add_action( 'wp_abilities_api_categories_init', '_gutenberg_register_core_ability_categories', 11 );
add_action( 'wp_abilities_api_init', '_gutenberg_register_core_abilities', 11 );