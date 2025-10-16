<?php
/**
 * Add MathML elements and attributes to wp_kses_allowed_html.
 *
 * @package gutenberg
 */

/**
 * Add MathML elements to the allowed tags array.
 *
 * This enables MathML content (e.g. converted from LaTeX, but also directly
 * imported or pasted) to pass through WordPress's content sanitization.
 *
 * @param array $allowedtags The allowed tags.
 *
 * @return array The allowed tags with MathML elements added.
 */
function gutenberg_kses_allow_mathml( $allowedtags ) {
	// https://www.w3.org/TR/mathml-core/#global-attributes
	// Except common attributes added by _wp_add_global_attributes.
	$global_attributes = array(
		'displaystyle'   => true,
		'scriptlevel'    => true,
		'mathbackground' => true,
		'mathcolor'      => true,
		'mathsize'       => true,
		// Common attributes also defined by _wp_add_global_attributes.
		// We do not want to add all those global attributes though.
		'class'            => true,
		'data-*'           => true,
		'dir'              => true,
		'id'               => true,
		'style'            => true,
	);

	// https://www.w3.org/TR/mathml-core/#the-top-level-math-element
	$allowedtags['math'] = array_merge(
		$global_attributes,
		array(
			'display' => true,
		)
	);

	// https://www.w3.org/TR/mathml-core/#token-elements
	$allowedtags['mtext'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#the-mi-element
	$allowedtags['mi'] = array_merge(
		$global_attributes,
		array(
			'mathvariant' => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#number-mn
	$allowedtags['mn'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#operator-fence-separator-or-accent-mo
	$allowedtags['mo'] = array_merge(
		$global_attributes,
		array(
			'form'          => true,
			'fence'         => true,
			'separator'     => true,
			'lspace'        => true,
			'rspace'        => true,
			'stretchy'      => true,
			'symmetric'     => true,
			'maxsize'       => true,
			'minsize'       => true,
			'largeop'       => true,
			'movablelimits' => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#space-mspace
	$allowedtags['mspace'] = array_merge(
		$global_attributes,
		array(
			'width'  => true,
			'height' => true,
			'depth'  => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#string-literal-ms
	$allowedtags['ms'] = $global_attributes;

	// https://www.w3.org/TR/mathml-core/#general-layout-schemata
	// https://www.w3.org/TR/mathml-core/#horizontally-group-sub-expressions-mrow
	$allowedtags['mrow'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#fractions-mfrac
	$allowedtags['mfrac'] = array_merge(
		$global_attributes,
		array(
			'linethickness' => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#radicals-msqrt-mroot
	$allowedtags['msqrt'] = $global_attributes;
	$allowedtags['mroot'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#style-change-mstyle
	$allowedtags['mstyle'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#error-message-merror
	$allowedtags['merror'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#adjust-space-around-content-mpadded
	$allowedtags['mpadded'] = array_merge(
		$global_attributes,
		array(
			'width'   => true,
			'height'  => true,
			'depth'   => true,
			'lspace'  => true,
			'voffset' => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#making-sub-expressions-invisible-mphantom
	$allowedtags['mphantom'] = $global_attributes;

	// https://www.w3.org/TR/mathml-core/#script-and-limit-schemata
	// https://www.w3.org/TR/mathml-core/#subscripts-and-superscripts-msub-msup-msubsup
	$allowedtags['msub']    = $global_attributes;
	$allowedtags['msup']    = $global_attributes;
	$allowedtags['msubsup'] = $global_attributes;
	// https://www.w3.org/TR/mathml-core/#underscripts-and-overscripts-munder-mover-munderover
	$overunder_attributes      = array(
		'accentunder' => true,
		'accent'      => true,
	);
	$allowedtags['munder']     = array_merge( $global_attributes, $overunder_attributes );
	$allowedtags['mover']      = array_merge( $global_attributes, $overunder_attributes );
	$allowedtags['munderover'] = array_merge( $global_attributes, $overunder_attributes );
	// https://www.w3.org/TR/mathml-core/#prescripts-and-tensor-indices-mmultiscripts
	$allowedtags['mmultiscripts'] = $global_attributes;
	$allowedtags['mprescripts']   = $global_attributes;

	// https://www.w3.org/TR/mathml-core/#tabular-math
	// https://www.w3.org/TR/mathml-core/#table-or-matrix-mtable
	$allowedtags['mtable'] = array_merge(
		$global_attributes,
		array(
			// Non-standard, used by temml/katex.
			// https://developer.mozilla.org/en-US/docs/Web/MathML/Reference/Element/mtable
			'columnalign'   => true,
			'rowspacing'    => true,
			'columnspacing' => true,
			'align'         => true,
			'rowalign'      => true,
			'columnlines'   => true,
			'rowlines'      => true,
			'frame'         => true,
			'framespacing'  => true,
			'width'         => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#row-in-table-or-matrix-mtr
	$allowedtags['mtr'] = array_merge(
		$global_attributes,
		array(
			// Non-standard, used by temml/katex.
			// https://developer.mozilla.org/en-US/docs/Web/MathML/Reference/Element/mtr
			'columnalign' => true,
			'rowalign'    => true,
		)
	);
	// https://www.w3.org/TR/mathml-core/#entry-in-table-or-matrix-mtd
	$allowedtags['mtd'] = array_merge(
		$global_attributes,
		array(
			'columnspan'  => true,
			'rowspan'     => true,
			// Non-standard, used by temml/katex.
			// https://developer.mozilla.org/en-US/docs/Web/MathML/Reference/Element/mtd
			'columnalign' => true,
			'rowalign'    => true,
		)
	);

	// https://www.w3.org/TR/mathml-core/#semantics-and-presentation
	$allowedtags['semantics']  = $global_attributes;
	$allowedtags['annotation'] = array_merge(
		$global_attributes,
		array(
			'encoding' => true,
		)
	);

	// Non-standard but widely supported, used by temml/katex.
	$allowedtags['menclose'] = array_merge(
		$global_attributes,
		array(
			'notation' => true,
		)
	);

	return $allowedtags;
}
add_filter( 'wp_kses_allowed_html', 'gutenberg_kses_allow_mathml' );
