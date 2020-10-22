<?php
/**
 * Duotone filter markup.
 *
 * @package gutenberg
 */

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param  string $slug      Unique slug for this duotone filter.
 * @param  mixed  $selectors CSS selectors to apply the duotone to.
 *                           `true` to select the whole block.
 *                           String for a single selector.
 *                           Array of strings for a multiple selectors.
 * @param  array  $values    R, G, and B values to filter with.
 * @return string            Duotone stylesheet and SVG.
 */
function gutenberg_render_duotone_filter( $slug, $selectors, $values ) {
	$duotone_id = 'duotone-filter-' . $slug;

	// boolean | string | string[] -> boolean[] | string[].
	$selectors = is_array( $selectors )
		? $selectors
		: array( $selectors );

	// boolean[] | string[] -> string[].
	$selectors = array_map(
		function ( $selector ) use ( $duotone_id ) {
			return is_string( $selector )
				? '.' . $duotone_id . ' ' . $selector
				: '.' . $duotone_id;
		},
		$selectors
	);

	// string[] -> string.
	$selectors = implode( ', ', $selectors );

	ob_start();

	?>

	<style>
		<?php echo $selectors; ?> {
			filter: url( <?php echo '#' . $duotone_id; ?> );
		}
	</style>

	<svg
		xmlns:xlink="http://www.w3.org/1999/xlink"
		viewBox="0 0 0 0"
		width="0"
		height="0"
		focusable="false"
		role="none"
		style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
	>
		<defs>
			<filter id="<?php echo $duotone_id; ?>">
				<feColorMatrix
					type="matrix"
					<?php // phpcs:disable Generic.WhiteSpace.DisallowSpaceIndent ?>
					values=".299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							0 0 0 1 0"
					<?php // phpcs:enable Generic.WhiteSpace.DisallowSpaceIndent ?>
				/>
				<feComponentTransfer color-interpolation-filters="sRGB" >
					<feFuncR type="table" tableValues="<?php echo implode( ' ', $values['r'] ); ?>" />
					<feFuncG type="table" tableValues="<?php echo implode( ' ', $values['g'] ); ?>" />
					<feFuncB type="table" tableValues="<?php echo implode( ' ', $values['b'] ); ?>" />
				</feComponentTransfer>
			</filter>
		</defs>
	</svg>

	<?php

	return ob_get_clean();
}
