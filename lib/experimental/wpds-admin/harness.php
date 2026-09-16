<?php
/**
 * Parity harness for the admin design tokens experiment.
 *
 * Renders classic control markup — buttons, fields, checkboxes and radios —
 * across every variant, size and state on a real wp-admin screen, so the
 * restyled result can be compared against the equivalent React components.
 *
 * It is a real admin page rather than a static fixture so that the full cascade
 * applies: the demoted Core stylesheets, the active admin colour scheme, and any
 * CSS added by other active plugins. Differences that only exist in computed
 * styles are visible here, where reading the stylesheets would miss them.
 *
 * Includes a control styled by an unlayered rule, standing in for third-party
 * plugin CSS, to check that such rules still take precedence over the restyle.
 *
 * Tools > WPDS Parity, visible only while the experiment is enabled.
 *
 * @package gutenberg
 */

/**
 * Registers the parity harness page.
 *
 * @since 24.1.0
 */
function gutenberg_wpds_admin_register_harness() {
	add_submenu_page(
		'tools.php',
		__( 'WPDS Parity', 'gutenberg' ),
		__( 'WPDS Parity', 'gutenberg' ),
		'manage_options',
		'wpds-parity',
		'gutenberg_wpds_admin_render_harness'
	);
}
add_action( 'admin_menu', 'gutenberg_wpds_admin_register_harness' );

/**
 * Returns the button state matrix.
 *
 * Classic drives state from CLASSES as well as pseudo-classes — legacy admin JS
 * toggles `.hover` / `.focus` / `.disabled`. Only the class forms can be
 * rendered statically, so those are what the harness shows; the pseudo-class
 * forms have to be checked interactively.
 *
 * Note `.active` is a PERSISTENT selected state, not `:active`.
 *
 * @since 24.1.0
 *
 * @return array<string, string> Map of label to extra markup for the button tag.
 */
function gutenberg_wpds_admin_harness_states() {
	return array(
		'default'              => '',
		'.hover'               => ' hover',
		'.focus'               => ' focus',
		'.active (persistent)' => ' active',
		'.disabled'            => ' disabled',
		'disabled attribute'   => '|disabled',
		'aria-disabled="true"' => '|aria-disabled="true"',
	);
}

/**
 * Renders the harness page.
 *
 * @since 24.1.0
 */
function gutenberg_wpds_admin_render_harness() {
	$variants = array(
		'.button (default)' => 'button',
		'.button-primary'   => 'button button-primary',
		'.button-secondary' => 'button button-secondary',
	);

	$sizes = array(
		'default (40px)'         => '',
		'.button-large (40px)'   => ' button-large',
		'.button-compact (32px)' => ' button-compact',
		'.button-small (24px)'   => ' button-small',
		'.button-hero (48px)'    => ' button-hero',
	);

	echo '<div class="wrap" id="wpds-parity">';
	echo '<h1>' . esc_html__( 'WPDS Parity — admin controls', 'gutenberg' ) . '</h1>';
	echo '<p>' . esc_html__( 'Admin control markup rendered under the real admin cascade, so each state can be compared against its design system counterpart. Pseudo-class states (:hover, :focus, :active) must be checked interactively; the class-driven equivalents admin JS toggles are shown below.', 'gutenberg' ) . '</p>';

	echo '<h2>' . esc_html__( 'Variants and states', 'gutenberg' ) . '</h2>';
	echo '<table class="widefat striped" style="max-width:1100px"><thead><tr><th>' . esc_html__( 'State', 'gutenberg' ) . '</th>';
	foreach ( array_keys( $variants ) as $variant_label ) {
		echo '<th>' . esc_html( $variant_label ) . '</th>';
	}
	echo '</tr></thead><tbody>';

	foreach ( gutenberg_wpds_admin_harness_states() as $state_label => $state ) {
		echo '<tr><td><code>' . esc_html( $state_label ) . '</code></td>';
		foreach ( $variants as $classes ) {
			list( $extra_class, $extra_attr ) = array_pad( explode( '|', $state, 2 ), 2, '' );
			printf(
				'<td><button type="button" class="%s%s" %s>%s</button></td>',
				esc_attr( $classes ),
				esc_attr( $extra_class ),
				// Attribute strings are from the fixed map above, not user input.
				$extra_attr, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				esc_html__( 'Button', 'gutenberg' )
			);
		}
		echo '</tr>';
	}
	echo '</tbody></table>';

	echo '<h2>' . esc_html__( 'Sizes', 'gutenberg' ) . '</h2>';
	echo '<p style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">';
	foreach ( $sizes as $size_label => $size_class ) {
		printf(
			'<button type="button" class="button%s">%s</button>',
			esc_attr( $size_class ),
			esc_html( $size_label )
		);
	}
	echo '</p>';

	echo '<h2>' . esc_html__( 'Button groups', 'gutenberg' ) . '</h2>';
	echo '<p>' . esc_html__( 'Grouped buttons join into one control: square inner corners, and borders that overlap rather than double.', 'gutenberg' ) . '</p>';
	$groups = array(
		array( '', array( 'button', 'button', 'button' ) ),
		array( '', array( 'button button-primary', 'button', 'button' ) ),
		array( ' button-compact', array( 'button', 'button', 'button' ) ),
	);
	echo '<p style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">';
	foreach ( $groups as $group ) {
		list( $group_class, $buttons ) = $group;
		printf( '<span class="button-group%s">', esc_attr( $group_class ) );
		foreach ( $buttons as $button_class ) {
			printf(
				'<button type="button" class="%s">%s</button>',
				esc_attr( $button_class ),
				esc_html__( 'Button', 'gutenberg' )
			);
		}
		echo '</span>';
	}
	echo '</p>';

	echo '<h2>' . esc_html__( 'Fields — states', 'gutenberg' ) . '</h2>';
	echo '<table class="widefat striped" style="max-width:1100px"><thead><tr><th>' . esc_html__( 'State', 'gutenberg' ) . '</th><th>' . esc_html__( 'Text input', 'gutenberg' ) . '</th><th>' . esc_html__( 'Select', 'gutenberg' ) . '</th><th>' . esc_html__( 'Textarea', 'gutenberg' ) . '</th></tr></thead><tbody>';

	$field_states = array(
		'default'              => '',
		'.disabled'            => ' class="disabled"',
		'disabled attribute'   => ' disabled',
		'aria-disabled="true"' => ' aria-disabled="true"',
		'readonly'             => ' readonly',
	);

	foreach ( $field_states as $state_label => $attrs ) {
		echo '<tr><td><code>' . esc_html( $state_label ) . '</code></td>';
		// Attribute strings come from the fixed map above, not from user input.
		printf(
			'<td><input type="text" value="%s"%s></td>',
			esc_attr__( 'Value', 'gutenberg' ),
			$attrs // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
		printf(
			'<td><select%s><option>%s</option></select></td>',
			$attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			esc_html__( 'Option', 'gutenberg' )
		);
		printf(
			'<td><textarea rows="2"%s>%s</textarea></td>',
			$attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			esc_textarea( __( 'Value', 'gutenberg' ) )
		);
		echo '</tr>';
	}
	echo '</tbody></table>';

	echo '<h2>' . esc_html__( 'Fields — types and placeholder', 'gutenberg' ) . '</h2>';
	echo '<p style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">';
	foreach ( array( 'text', 'search', 'email', 'url', 'number', 'date', 'password' ) as $type ) {
		printf(
			'<input type="%1$s" placeholder="%1$s">',
			esc_attr( $type )
		);
	}
	echo '</p>';

	echo '<h2>' . esc_html__( 'Fields — invalid', 'gutenberg' ) . '</h2>';
	echo '<p>' . esc_html__( 'Core marks the invalid border with !important, so this is driven from the wpds-overrides layer rather than 20-input.css.', 'gutenberg' ) . '</p>';
	echo '<p class="form-invalid form-required"><input type="text" value="" placeholder="' . esc_attr__( 'Invalid field', 'gutenberg' ) . '"></p>';

	echo '<h2>' . esc_html__( 'Checkboxes and radios', 'gutenberg' ) . '</h2>';
	echo '<table class="widefat striped" style="max-width:900px"><thead><tr><th>' . esc_html__( 'State', 'gutenberg' ) . '</th><th>' . esc_html__( 'Checkbox', 'gutenberg' ) . '</th><th>' . esc_html__( 'Checkbox, checked', 'gutenberg' ) . '</th><th>' . esc_html__( 'Radio', 'gutenberg' ) . '</th><th>' . esc_html__( 'Radio, checked', 'gutenberg' ) . '</th></tr></thead><tbody>';

	$toggle_states = array(
		'default'              => '',
		'.disabled'            => ' class="disabled"',
		'disabled attribute'   => ' disabled',
		'aria-disabled="true"' => ' aria-disabled="true"',
	);

	$row = 0;
	foreach ( $toggle_states as $state_label => $attrs ) {
		++$row;
		echo '<tr><td><code>' . esc_html( $state_label ) . '</code></td>';
		foreach ( array( 'checkbox', 'radio' ) as $type ) {
			foreach ( array( '', ' checked' ) as $checked ) {
				printf(
					'<td><input type="%s" name="wpds-parity-%s-%d"%s%s></td>',
					esc_attr( $type ),
					esc_attr( $type ),
					(int) $row,
					// Both come from the fixed maps above, not from user input.
					$checked, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					$attrs // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				);
			}
		}
		echo '</tr>';
	}
	echo '</tbody></table>';

	echo '<h2>' . esc_html__( 'Ecosystem override check', 'gutenberg' ) . '</h2>';
	echo '<p>' . esc_html__( 'This button is styled by an unlayered rule, exactly as a third-party plugin would style it. It MUST stay orange — if it picks up the restyle instead, the back-compat guarantee this work depends on is broken.', 'gutenberg' ) . '</p>';
	// Unlayered on purpose: this stands in for third-party plugin CSS.
	echo '<style>.wpds-parity-plugin-override { background: #e06d1f; color: #fff; border-color: #e06d1f; }</style>';
	echo '<p><button type="button" class="button wpds-parity-plugin-override">' . esc_html__( 'Plugin-styled button', 'gutenberg' ) . '</button></p>';

	echo '</div>';

	/*
	 * `aria-disabled` controls stay focusable, which is the point of the
	 * attribute, but nothing else about them is inert: browsers still let the
	 * specimens be typed in, toggled and opened. On a real screen the markup's
	 * owner prevents that. Here it would let a specimen drift out of the state
	 * it is labelled with, so pointer and keyboard activation are blocked while
	 * Tab still moves focus and the selectors stay intact for comparison.
	 */
	wp_print_inline_script_tag(
		"( function () {
			var wrap = document.getElementById( 'wpds-parity' );
			if ( ! wrap ) {
				return;
			}
			var isInert = function ( target ) {
				return target.closest && target.closest( '[aria-disabled=\"true\"]' );
			};
			var block = function ( event ) {
				if ( isInert( event.target ) ) {
					event.preventDefault();
				}
			};
			[ 'click', 'beforeinput', 'paste', 'drop' ].forEach( function ( type ) {
				wrap.addEventListener( type, block, true );
			} );
			// Only selects: blocking mousedown elsewhere would also stop a click from focusing the field.
			wrap.addEventListener( 'mousedown', function ( event ) {
				if ( 'SELECT' === event.target.tagName ) {
					block( event );
				}
			}, true );
			wrap.addEventListener( 'keydown', function ( event ) {
				if ( 'Tab' !== event.key && isInert( event.target ) ) {
					event.preventDefault();
				}
			}, true );
		} )();"
	);
}
