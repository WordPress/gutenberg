<?php
/**
 * Duotone filter markup.
 *
 * @package gutenberg
 */

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param  string $selector CSS selectors to apply the duotone to.
 * @param  string $id       Unique slug for this duotone filter.
 * @param  array  $values   R, G, and B values to filter with.
 * @return string           Duotone stylesheet and SVG.
 */
function gutenberg_render_duotone_filter( $selector, $id, $values ) {
	ob_start();

	?>

	<style>
		<?php echo $selector; ?> {
			filter: url( <?php echo '#' . $id; ?> );
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
			<filter id="<?php echo $id; ?>">
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
