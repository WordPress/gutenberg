<?php

include_once 'utils.php';

// phpcs:disable
$duotone_id       = $block_attributes['duotoneId'];
$duotone_selector = '.wp-block-image.' . $duotone_id . ' img';
$duotone_colors   = array_map( 'hex2rgb', $block_attributes['duotoneColors'] );
$duotone_colors   = array_reduce( $duotone_colors, 'separate_color_components', [ 'r' => [], 'g' => [], 'b' => [] ] )
// phpcs:enable

?>

<style>
	<?php echo $duotone_selector; ?> {
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
				<?php // phpcs:disable ?>
				values=".299 .587 .114 0 0
				        .299 .587 .114 0 0
				        .299 .587 .114 0 0
				        0 0 0 1 0"
				<?php // phpcs:enable ?>
			/>
			<feComponentTransfer color-interpolation-filters="sRGB">
				<feFuncR type="table" tableValues="<?php echo join( ' ', $duotone_colors['r'] ); ?>" />
				<feFuncG type="table" tableValues="<?php echo join( ' ', $duotone_colors['g'] ); ?>" />
				<feFuncB type="table" tableValues="<?php echo join( ' ', $duotone_colors['b'] ); ?>" />
			</feComponentTransfer>
		</filter>
	</defs>
</svg>
