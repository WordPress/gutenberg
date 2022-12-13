<?php
/**
 * Effects block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style attribute used by the effects feature if needed for block
 * types that support effects.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_effects_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( block_has_support( $block_type, array( '__experimentalEffects' ) ) && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Renders the effects config to the block wrapper.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_effects_support_flag( $block_content, $block ) {
	$block_type  = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$has_support = block_has_support( $block_type, array( '__experimentalEffects' ), true );

	if ( ! $has_support ) {
		return $block_content;
	}

	$effects_styles = '';
	if ( isset( $block['attrs']['effect'] ) ) {
		$effects_styles  .= "animation-name:{$block['attrs']['effect']};";
		$default_duration = '0.5';
		$used_duration    = isset( $block['attrs']['effectDuration'] ) ? $block['attrs']['effectDuration'] : $default_duration;
		$effects_styles  .= "animation-duration:{$used_duration}s;";

		$tags = new WP_HTML_Tag_Processor( $block_content );
		$tags->next_tag();
		$style = $tags->get_attribute( 'style' );
		if ( $style ) {
			$block_content = preg_replace(
				'/style=\".*?\"/',
				"style='$style;$effects_styles'",
				$block_content,
				1
			);
		} else {
			$tags->set_attribute( 'style', $effects_styles );
			$block_content = (string) $tags;
		}
		// var_dump( $block_content );
	}
	return $block_content;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'effects',
	array(
		'register_attribute' => 'gutenberg_register_effects_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_effects_support_flag', 10, 2 );
