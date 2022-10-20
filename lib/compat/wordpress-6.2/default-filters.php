<?php

add_action( 'switch_theme', 'wp_theme_clean_theme_json_cached_data' );
add_action( 'start_previewing_theme', 'wp_theme_clean_theme_json_cached_data' );
