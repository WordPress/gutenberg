<?php
/**
 * Markup for navigation around inert HTML content.
 *
 * @package gutenberg-test-interactive-blocks
 */

// Block rendering supplies attributes; standalone inclusion uses defaults.
$fixture_attributes = get_defined_vars()['attributes'] ?? array();
$letter             = $fixture_attributes['letter'] ?? 'A';
$mode               = $fixture_attributes['mode'] ?? 'fallback';
$has_copy           = $fixture_attributes['copy'] ?? true;
$copy_before        = $fixture_attributes['before'] ?? false;
$region_value       = 'attach' === $mode ? wp_json_encode(
	array(
		'id'       => 'html/o',
		'attachTo' => 'body',
	)
) : 'html/r';

// Derived server state keeps fallback content without defining a client value.
wp_interactivity_state(
	'router-html-regions',
	array(
		/**
		 * Computes the fallback's pending server value.
		 *
		 * @return null The client getter is intentionally unavailable.
		 */
		'pending' => static function () {
			return null;
		},
	)
);

add_filter(
	'script_module_data_@wordpress/interactivity',
	/**
	 * Declares the server getter referenced by the HTML directive.
	 *
	 * @param array|null $data Serialized runtime data.
	 * @return array Runtime data with the pending getter declaration.
	 */
	static function ( $data ) {
		$data = $data ?? array();
		$data['derivedStateClosures']['router-html-regions'][] = 'state.pending';
		return $data;
	}
);

$copy_markup = $has_copy ? sprintf(
	'<div data-testid="html-owner" data-wp-html="state.pending"><div data-testid="copy" data-wp-interactive="router-html-regions" data-wp-router-region="%s" data-wp-init="actions.mark"><p>copy</p></div></div>',
	esc_attr( $region_value )
) : '';
?>
<div data-wp-interactive="router-html-regions">
	<a data-testid="next" data-wp-on--click="actions.navigate" href="<?php echo esc_url( $fixture_attributes['next'] ?? '' ); ?>">Next</a>
	<output data-testid="marks" data-wp-text="state.marks">0</output>
	<?php
	if ( $copy_before && 'fallback' === $mode ) {
		echo $copy_markup;
	}
	?>
	<?php if ( 'attach' !== $mode || 'B' === $letter ) : ?>
		<div data-testid="real" data-wp-interactive="router-html-regions" data-wp-router-region="<?php echo esc_attr( $region_value ); ?>">
			<p><?php echo esc_html( 'attach' === $mode ? 'overlay ' . $letter : $letter ); ?></p>
		</div>
	<?php endif; ?>
	<?php
	if ( ! $copy_before && 'inserted' !== $mode ) {
		echo $copy_markup;
	}
	?>
	<?php if ( 'inserted' === $mode && 'A' === $letter ) : ?>
		<div data-testid="html-owner" data-wp-html="state.inserted"></div>
	<?php endif; ?>
</div>
