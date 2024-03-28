<?php

function mytheme_setup_theme_supported_features() {
    // Add theme support for block templates
    add_theme_support('block-templates');
}

add_action('after_setup_theme', 'mytheme_setup_theme_supported_features');
