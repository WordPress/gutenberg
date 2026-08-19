<?php
/**
 * Widget Type Composer: the `widget-def/site-health-counts` dynamic block.
 *
 * A server-rendered block for composed widget definitions: it reads the
 * cached Site Health counts at `do_blocks()` time, so a composition carries
 * backend data with no dedicated data endpoint.
 *
 * @package gutenberg
 */

/**
 * Registers the dynamic block.
 */
function gutenberg_register_site_health_counts_block() {
	if ( WP_Block_Type_Registry::get_instance()->is_registered( 'widget-def/site-health-counts' ) ) {
		return;
	}

	register_block_type(
		'widget-def/site-health-counts',
		array(
			'api_version'     => 3,
			'render_callback' => 'gutenberg_render_site_health_counts_block',
		)
	);
}
add_action( 'init', 'gutenberg_register_site_health_counts_block' );

/**
 * Renders the cached Site Health counts.
 *
 * The source is the `health-check-site-status-result` transient core's Site
 * Health screen maintains: a JSON string carrying the `good`, `recommended`,
 * and `critical` counts of the latest run.
 *
 * @return string Rendered HTML.
 */
function gutenberg_render_site_health_counts_block() {
	/*
	 * The counts reveal whether the site has unresolved issues. Site Health
	 * itself sits behind this capability, while the widget-defs render
	 * endpoint only requires `read`, so the gate is re-applied here: anyone
	 * below it gets no output.
	 */
	if ( ! current_user_can( 'view_site_health_checks' ) ) {
		return '';
	}

	$counts = gutenberg_get_site_health_counts();

	if ( null === $counts ) {
		return '<p style="margin:0;">' .
			esc_html__( 'No health check results yet. Visit Site Health to run the checks.', 'gutenberg' ) .
			'</p>';
	}

	$items = array(
		array( __( 'Good', 'gutenberg' ), $counts['good'], 'success' ),
		array( __( 'Should be improved', 'gutenberg' ), $counts['recommended'], 'caution' ),
		array( __( 'Critical', 'gutenberg' ), $counts['critical'], 'error' ),
	);

	/*
	 * Inline styles: no stylesheet ships with a composition. The WPDS tokens
	 * resolve because this HTML mounts inside the admin page; each status
	 * uses the background-surface/foreground-content pair, the badge recipe.
	 */
	$html = '<div style="display:flex;flex-direction:column;gap:var(--wpds-dimension-gap-sm);margin:0;">';

	foreach ( $items as $item ) {
		list( $label, $count, $status ) = $item;

		$pill_style = 'display:inline-flex;align-items:center;justify-content:center;' .
			'min-width:28px;' .
			'padding:var(--wpds-dimension-padding-xs) var(--wpds-dimension-padding-sm);' .
			'border-radius:var(--wpds-border-radius-xl);' .
			'font-weight:600;line-height:1;' .
			'background:var(--wpds-color-background-surface-' . $status . ');' .
			'color:var(--wpds-color-foreground-content-' . $status . ');';

		$html .= '<div style="display:flex;align-items:center;gap:var(--wpds-dimension-gap-sm);">' .
			'<span style="' . esc_attr( $pill_style ) . '">' .
			(int) $count .
			'</span>' .
			'<span>' . esc_html( $label ) . '</span>' .
			'</div>';
	}

	return $html . '</div>';
}

/**
 * Reads and shape-checks the cached Site Health counts.
 *
 * @return array|null Counts keyed `good` / `recommended` / `critical`, or
 *                    `null` when the transient is absent or malformed.
 */
function gutenberg_get_site_health_counts() {
	$raw = get_transient( 'health-check-site-status-result' );

	if ( ! is_string( $raw ) || '' === $raw ) {
		return null;
	}

	$decoded = json_decode( $raw, true );

	// Valid JSON of the wrong shape is the common case, not malformed JSON.
	if ( ! is_array( $decoded ) ) {
		return null;
	}

	$counts = array();

	foreach ( array( 'good', 'recommended', 'critical' ) as $key ) {
		if ( ! isset( $decoded[ $key ] ) || ! is_numeric( $decoded[ $key ] ) ) {
			return null;
		}

		$counts[ $key ] = (int) $decoded[ $key ];
	}

	return $counts;
}
