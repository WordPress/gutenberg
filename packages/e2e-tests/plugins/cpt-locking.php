<?php
/**
 * Plugin Name: Gutenberg Test Plugin, CPT Locking
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-cpt-locking
 */

/**
 * Registers CPT's with 3 diffferent types of locking.
 */
function gutenberg_test_cpt_locking() {
	$template = array(
		array( 'core/image' ),
		array(
			'core/paragraph',
			array(
				'placeholder' => 'Add a description',
			),
		),
		array( 'core/quote' ),
		array( 'core/columns' ),
	);
	register_post_type(
		'locked-all-post',
		array(
			'public'        => true,
			'label'         => 'Locked All Post',
			'show_in_rest'  => true,
			'template'      => $template,
			'template_lock' => 'all',
		)
	);
	register_post_type(
		'locked-insert-post',
		array(
			'public'        => true,
			'label'         => 'Locked Insert Post',
			'show_in_rest'  => true,
			'template'      => $template,
			'template_lock' => 'insert',
		)
	);
	register_post_type(
		'not-locked-post',
		array(
			'public'        => true,
			'label'         => 'Not Locked Post',
			'show_in_rest'  => true,
			'template'      => $template,
			'template_lock' => false,
		)
	);
	register_post_type(
		'l-post-ul-group',
		array(
			'public'        => true,
			'label'         => 'Locked Post Unlocked group',
			'show_in_rest'  => true,
			'template'      => array(
				array(
					'core/group',
					array(
						'templateLock' => false,
					),
					array(
						array( 'core/quote' ),
						array(
							'core/paragraph',
							array(
								'placeholder' => 'Add a description',
							),
						),
					),
				),
			),
			'template_lock' => 'all',
		)
	);
	register_post_type(
		'l-post-l-group',
		array(
			'public'        => true,
			'label'         => 'Locked Post Locked group',
			'show_in_rest'  => true,
			'template'      => array(
				array(
					'core/group',
					array(
						'templateLock' => 'all',
					),
					array(
						array( 'core/quote' ),
						array(
							'core/paragraph',
							array(
								'placeholder' => 'Add a description',
							),
						),
					),
				),
			),
			'template_lock' => 'all',
		)
	);
	register_post_type(
		'l-post-i-group',
		array(
			'public'        => true,
			'label'         => 'Locked Post Inherited group',
			'show_in_rest'  => true,
			'template'      => array(
				array(
					'core/group',
					array(),
					array(
						array( 'core/quote' ),
						array(
							'core/paragraph',
							array(
								'placeholder' => 'Add a description',
							),
						),
					),
				),
			),
			'template_lock' => 'all',
		)
	);
}

add_action( 'init', 'gutenberg_test_cpt_locking' );
