<?php
/**
 * Bootstrapping the Gutenberg experiments page.
 *
 * @package gutenberg
 *
 * ## Creating a New Experiment
 *
 * To add a new experiment, add it to the array in `gutenberg_get_experiment_definitions()`:
 *
 * ```php
 * array(
 *     'id'          => 'my-experiment-id',
 *     'title'       => __( 'My Experiment Title', 'gutenberg' ),
 *     'description' => __( 'What this experiment does...', 'gutenberg' ),
 *     'category'    => 'blocks', // Optional - defaults to 'uncategorized'
 *     'requires'    => 'other-experiment-id', // Optional - ID of required experiment
 * ),
 * ```
 *
 * Notes:
 * - Category is optional - if omitted, experiment goes under "Uncategorized"
 * - New categories are automatically created and displayed
 * - Description is optional but recommended for user clarity
 *
 * IMPORTANT: If you need to access the experiment status from the block editor client side,
 * you also need to add the corresponding inline script to `gutenberg_enable_experiments()`
 * in `lib/experimental/editor-settings.php. Example:
 *
 * ```php
 * if ( $gutenberg_experiments && array_key_exists( 'my-experiment-id', $gutenberg_experiments ) ) {
 *     wp_add_inline_script( 'wp-block-editor', 'window.__experimentalMyExperiment = true', 'before' );
 * }
 * ```
 */

/**
 * Get all experiment definitions. Add your new experiments here.
 *
 * @return array Array of experiment definitions.
 */
function gutenberg_get_experiment_definitions() {
	return array(
		array(
			'id'          => 'gutenberg-block-experiments',
			'title'       => __( 'Blocks: add experimental blocks', 'gutenberg' ),
			'description' => __( 'Enables experimental blocks on a rolling basis as they are developed.<p class="description">(Warning: these blocks may have significant changes during development that cause validation errors and display issues.)</p>', 'gutenberg' ),
			'category'    => 'blocks',
		),
		array(
			'id'          => 'gutenberg-form-blocks',
			'title'       => __( 'Blocks: add Form and input blocks', 'gutenberg' ),
			'description' => __( 'Enables new blocks to allow building forms. You are likely to experience UX issues that are being addressed.', 'gutenberg' ),
			'category'    => 'blocks',
		),
		array(
			'id'          => 'gutenberg-grid-interactivity',
			'title'       => __( 'Blocks: add Grid interactivity', 'gutenberg' ),
			'description' => __( 'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
			'category'    => 'blocks',
		),
		array(
			'id'          => 'gutenberg-no-tinymce',
			'title'       => __( 'Blocks: disable TinyMCE and Classic block', 'gutenberg' ),
			'description' => __( 'Disables the TinyMCE and Classic block.', 'gutenberg' ),
			'category'    => 'blocks',
		),
		array(
			'id'          => 'gutenberg-media-processing',
			'title'       => __( 'Client-side media processing', 'gutenberg' ),
			'description' => __( 'Enables client-side media processing to leverage the browser\'s capabilities to handle tasks like image resizing and compression.', 'gutenberg' ),
			'category'    => 'media',
		),
		array(
			'id'          => 'gutenberg-sync-collaboration',
			'title'       => __( 'Collaboration: add real time editing', 'gutenberg' ),
			'description' => __( 'Enables live collaboration and offline persistence between peers.', 'gutenberg' ),
			'category'    => 'collaboration',
		),
		array(
			'id'          => 'gutenberg-color-randomizer',
			'title'       => __( 'Color randomizer', 'gutenberg' ),
			'description' => __( 'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.', 'gutenberg' ),
			'category'    => 'styling',
		),
		array(
			'id'          => 'gutenberg-new-posts-dashboard',
			'title'       => __( 'Data Views: enable for Posts', 'gutenberg' ),
			'description' => __( 'Enables a redesigned posts dashboard accessible through a submenu item in the Gutenberg plugin.', 'gutenberg' ),
			'category'    => 'data-views',
		),
		array(
			'id'          => 'gutenberg-quick-edit-dataviews',
			'title'       => __( 'Data Views: add Quick Edit', 'gutenberg' ),
			'description' => __( 'Enables access to a Quick Edit panel in the Site Editor Pages experience.', 'gutenberg' ),
			'category'    => 'data-views',
		),
		array(
			'id'          => 'gutenberg-dataviews-media-modal',
			'title'       => __( 'Data Views: new media modal', 'gutenberg' ),
			'description' => __( 'Enables a new media modal experience powered by Data Views for improved media library management.', 'gutenberg' ),
			'category'    => 'data-views',
		),
		array(
			'id'          => 'gutenberg-full-page-client-side-navigation',
			'title'       => __( 'Interactivity API: Full-page client-side navigation', 'gutenberg' ),
			'description' => __( 'Enables full-page client-side navigation, powered by the Interactivity API.', 'gutenberg' ),
			'category'    => 'interactivity',
		),
		array(
			'id'          => 'gutenberg-content-only-pattern-insertion',
			'title'       => __( 'Pattern editing: Make patterns "content only" by default upon insertion', 'gutenberg' ),
			'description' => __( 'When patterns are inserted, default to a simplified content only mode for editing pattern content.', 'gutenberg' ),
			'category'    => 'patterns',
		),
		array(
			'id'          => 'gutenberg-content-only-inspector-fields',
			'title'       => __( 'Pattern editing: Enable editable inspector fields', 'gutenberg' ),
			'description' => __( 'Enables editable inspector fields (media, links, alt text, etc.) in the "content only" pattern editing interface. Requires "Pattern editing: Make patterns "content only" by default upon insertion" to be enabled.', 'gutenberg' ),
			'category'    => 'patterns',
			'requires'    => 'gutenberg-content-only-pattern-insertion',
		),
		array(
			'id'          => 'gutenberg-workflow-palette',
			'title'       => __( 'Workflow Palette', 'gutenberg' ),
			'description' => __( 'Enables the Workflow Palette for running workflows composed of abilities, from a unified interface.', 'gutenberg' ),
			'category'    => 'workflow',
		),
		array(
			'id'          => 'gutenberg-customizable-navigation-overlays',
			'title'       => __( 'Customizable Navigation Overlays', 'gutenberg' ),
			'description' => __( 'Enables custom mobile overlay design and content control for Navigation blocks, allowing you to create flexible, professional menu experiences.', 'gutenberg' ),
			'category'    => 'styling',
		),
	);
}

/*
 * END CONFIGURATION.
 * If you're not adding new experiments, you can stop here.
 */

if ( ! function_exists( 'the_gutenberg_experiments' ) ) {
	/**
	 * The main entry point for the Gutenberg experiments page.
	 */
	function the_gutenberg_experiments() {
		$experiments   = gutenberg_get_experiment_definitions();
		$enabled_count = 0;
		$total_count   = count( $experiments );
		$options       = get_option( 'gutenberg-experiments', array() );

		foreach ( $experiments as $experiment ) {
			if ( isset( $options[ $experiment['id'] ] ) && $options[ $experiment['id'] ] ) {
				++$enabled_count;
			}
		}

		// Count active_templates separately
		if ( gutenberg_is_experiment_enabled( 'active_templates' ) ) {
			++$enabled_count;
			++$total_count;
		}

		?>
		<div id="experiments-editor" class="wrap">
			<div class="experiments-header">
				<h1><?php echo esc_html__( 'Experimental settings', 'gutenberg' ); ?></h1>
				<div class="experiments-header-info">
					<span class="experiments-count">
						<?php
						printf(
							/* translators: %1$d: number of enabled experiments, %2$d: total number of experiments */
							esc_html__( '%1$d of %2$d experiments enabled', 'gutenberg' ),
							$enabled_count,
							$total_count
						);
						?>
					</span>
				</div>
			</div>
			<?php settings_errors(); ?>
			<p class="experiments-description">
				<?php echo esc_html__( "The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.", 'gutenberg' ); ?>
			</p>

			<div class="experiments-controls">
				<div class="experiments-search">
					<label for="experiments-search-input" class="screen-reader-text">
						<?php echo esc_html__( 'Search experiments', 'gutenberg' ); ?>
					</label>
					<input
						type="search"
						id="experiments-search-input"
						class="experiments-search-input"
						placeholder="<?php echo esc_attr__( 'Search experiments...', 'gutenberg' ); ?>"
					/>
				</div>
				<div class="experiments-actions">
					<button type="button" class="button button-secondary" id="experiments-filter-enabled">
						<?php echo esc_html__( 'Show only enabled', 'gutenberg' ); ?>
					</button>
					<button type="button" class="button button-secondary" id="experiments-toggle-all">
						<?php echo esc_html__( 'Toggle all on/off', 'gutenberg' ); ?>
					</button>
				</div>
			</div>

			<form method="post" action="options.php" id="experiments-form">
				<?php settings_fields( 'gutenberg-experiments' ); ?>
				<?php
				// Render category sections manually to have proper control
				$categories  = gutenberg_get_experiment_categories();
				$definitions = gutenberg_get_experiment_definitions();
				$options     = get_option( 'gutenberg-experiments', array() );

				// Group experiments by category
				$experiments_by_category = array();
				foreach ( $definitions as $experiment ) {
					$cat = isset( $experiment['category'] ) ? $experiment['category'] : 'uncategorized';
					if ( ! isset( $experiments_by_category[ $cat ] ) ) {
						$experiments_by_category[ $cat ] = array();
					}
					$experiments_by_category[ $cat ][] = $experiment;
				}

				// Get all categories that have experiments (including dynamically added ones)
				$all_category_ids = array_unique( array_merge( array_keys( $categories ), array_keys( $experiments_by_category ) ) );

				// Render each category section
				foreach ( $all_category_ids as $category_id ) {
					if ( ! isset( $experiments_by_category[ $category_id ] ) ) {
						continue;
					}
					// Use predefined category name if available, otherwise generate from ID
					$category_name = isset( $categories[ $category_id ] ) ? $categories[ $category_id ] : ucwords( str_replace( array( '-', '_' ), ' ', $category_id ) );
					?>
					<div class="experiments-category-section" data-category="<?php echo esc_attr( $category_id ); ?>">
						<div class="experiments-category-header">
							<?php echo esc_html( $category_name ); ?>
						</div>
						<div class="experiments-category-content">
							<?php
							foreach ( $experiments_by_category[ $category_id ] as $experiment ) {
								$value            = isset( $options[ $experiment['id'] ] ) ? 1 : 0;
								$requires         = isset( $experiment['requires'] ) ? $experiment['requires'] : '';
								$description      = isset( $experiment['description'] ) ? $experiment['description'] : '';
								$required_enabled = false;
								if ( $requires ) {
									$required_enabled = isset( $options[ $requires ] ) && $options[ $requires ];
								}

								// Get required experiment title if dependency exists
								$required_title = '';
								if ( $requires ) {
									foreach ( $definitions as $def ) {
										if ( $def['id'] === $requires ) {
											$required_title = $def['title'];
											break;
										}
									}
								}
								?>
								<div class="experiment-field" data-category="<?php echo esc_attr( $category_id ); ?>" data-requires="<?php echo esc_attr( $requires ); ?>">
									<div class="experiment-field-header">
										<label for="<?php echo esc_attr( $experiment['id'] ); ?>" class="experiment-field-title">
											<input
												type="checkbox"
												name="<?php echo esc_attr( 'gutenberg-experiments[' . $experiment['id'] . ']' ); ?>"
												id="<?php echo esc_attr( $experiment['id'] ); ?>"
												value="1"
												<?php checked( 1, $value ); ?>
												<?php echo ( $requires && ! $required_enabled && $value ) ? 'disabled' : ''; ?>
											/>
											<?php echo esc_html( $experiment['title'] ); ?>
										</label>
										<div class="experiment-field-badges">
											<span class="experiment-badge <?php echo $value ? 'enabled' : 'disabled'; ?>">
												<?php echo $value ? esc_html__( 'Enabled', 'gutenberg' ) : esc_html__( 'Disabled', 'gutenberg' ); ?>
											</span>
										</div>
									</div>
									<?php if ( $description ) : ?>
										<div class="experiment-field-description">
											<?php echo wp_kses_post( $description ); ?>
										</div>
									<?php endif; ?>
									<?php if ( $requires ) : ?>
										<div class="experiment-field-actions">
											<div class="experiment-dependency-warning <?php echo ( $value && ! $required_enabled ) ? 'show' : ''; ?>">
												<strong><?php echo esc_html__( 'Dependency required:', 'gutenberg' ); ?></strong>
												<?php
												printf(
													/* translators: %s: Name of required experiment */
													esc_html__( 'This experiment requires "%s" to be enabled.', 'gutenberg' ),
													esc_html( $required_title ? $required_title : $requires )
												);
												?>
											</div>
										</div>
									<?php endif; ?>
								</div>
								<?php
							}
							?>
						</div>
					</div>
					<?php
				}
				?>

				<!-- Template Activation experiment (separate option) -->
				<div class="experiments-category-section" data-category="templates">
					<div class="experiments-category-header">
						<?php
						$categories = gutenberg_get_experiment_categories();
						echo esc_html( isset( $categories['templates'] ) ? $categories['templates'] : __( 'Templates', 'gutenberg' ) );
						?>
					</div>
					<div class="experiments-category-content">
						<div class="experiment-field" data-category="templates">
							<div class="experiment-field-header">
								<label for="active_templates" class="experiment-field-title">
									<input
										type="checkbox"
										name="active_templates"
										id="active_templates"
										value="1"
										<?php checked( 1, gutenberg_is_experiment_enabled( 'active_templates' ) ); ?>
									/>
									<?php echo esc_html__( 'Template Activation', 'gutenberg' ); ?>
								</label>
								<div class="experiment-field-badges">
									<span class="experiment-badge <?php echo gutenberg_is_experiment_enabled( 'active_templates' ) ? 'enabled' : 'disabled'; ?>">
										<?php echo gutenberg_is_experiment_enabled( 'active_templates' ) ? esc_html__( 'Enabled', 'gutenberg' ) : esc_html__( 'Disabled', 'gutenberg' ); ?>
									</span>
								</div>
							</div>
							<div class="experiment-field-description">
								<?php echo esc_html__( 'Allows multiple templates of the same type to be created, of which one can be active at a time.', 'gutenberg' ); ?>
							</div>
							<div class="experiment-field-actions">
								<a href="https://github.com/WordPress/gutenberg/issues/66950" target="_blank" class="button-link">
									<?php echo esc_html__( 'Learn more', 'gutenberg' ); ?>
								</a>
								<p class="description" style="margin-top: 8px; color: #d63638;">
									<?php echo esc_html__( 'Warning: when you deactivate this experiment, it is best to delete all created templates except for the active ones.', 'gutenberg' ); ?>
								</p>
							</div>
						</div>
					</div>
				</div>

				<?php submit_button(); ?>
			</form>
		</div>

		<style>
		.experiments-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}
		.experiments-header-info {
			display: flex;
			align-items: center;
			gap: 15px;
		}
		.experiments-count {
			color: #646970;
			font-size: 14px;
		}
		.experiments-description {
			margin-bottom: 20px;
			color: #646970;
		}
		.experiments-controls {
			display: flex;
			gap: 15px;
			margin-bottom: 20px;
			flex-wrap: wrap;
			align-items: center;
		}
		.experiments-search {
			flex: 1;
			min-width: 200px;
		}
		.experiments-search-input {
			width: 100%;
			padding: 6px 12px;
			border: 1px solid #8c8f94;
			border-radius: 4px;
			font-size: 14px;
		}
		.experiments-actions {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}
		.experiments-category-section {
			margin-bottom: 30px;
			border: 1px solid #c3c4c7;
			background: #fff;
			box-shadow: 0 1px 1px rgba(0,0,0,.04);
		}
		.experiments-category-header {
			padding: 12px 20px;
			background: #f6f7f7;
			border-bottom: 1px solid #c3c4c7;
			font-weight: 600;
			font-size: 14px;
		}
		.experiments-category-content {
			padding: 20px;
		}
		.experiment-field {
			margin-bottom: 20px;
			padding-bottom: 20px;
			border-bottom: 1px solid #f0f0f1;
		}
		.experiment-field:last-child {
			border-bottom: none;
			margin-bottom: 0;
			padding-bottom: 0;
		}
		.experiment-field-header {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			margin-bottom: 8px;
		}
		.experiment-field-title {
			flex: 1;
			font-weight: 600;
			font-size: 14px;
		}
		.experiment-field-badges {
			display: flex;
			gap: 8px;
			align-items: center;
		}
		.experiment-badge {
			padding: 2px 8px;
			border-radius: 3px;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.experiment-badge.enabled {
			background: #00a32a;
			color: #fff;
		}
		.experiment-badge.disabled {
			background: #dcdcde;
			color: #50575e;
		}
		.experiment-field-description {
			color: #646970;
			font-size: 13px;
			line-height: 1.6;
			margin-left: 28px;
			margin-top: 8px;
		}
		.experiment-field-actions {
			margin-left: 28px;
			margin-top: 8px;
		}
		.experiment-dependency-warning {
			display: none;
			margin-top: 8px;
			padding: 8px 12px;
			background: #fff3cd;
			border-left: 4px solid #dba617;
			color: #856404;
			font-size: 13px;
		}
		.experiment-dependency-warning.show {
			display: block;
		}
		.experiment-field[data-category] {
			transition: opacity 0.2s;
		}
		.experiment-field.hidden {
			display: none;
		}
		.experiments-category-section.hidden {
			display: none;
		}
		</style>

		<script>
		(function() {
			var searchInput = document.getElementById('experiments-search-input');
			var filterEnabledButton = document.getElementById('experiments-filter-enabled');
			var toggleAllButton = document.getElementById('experiments-toggle-all');
			var experimentFields = document.querySelectorAll('.experiment-field');
			var categorySections = document.querySelectorAll('.experiments-category-section');
			var showOnlyEnabled = false;

			function isExperimentEnabled(field) {
				var checkbox = field.querySelector('input[type="checkbox"]');
				return checkbox && checkbox.checked;
			}

			function filterExperiments() {
				var searchTerm = searchInput.value.toLowerCase();

				experimentFields.forEach(function(field) {
					var fieldText = field.textContent.toLowerCase();
					var matchesSearch = !searchTerm || fieldText.indexOf(searchTerm) !== -1;
					var matchesEnabledFilter = !showOnlyEnabled || isExperimentEnabled(field);

					if (matchesSearch && matchesEnabledFilter) {
						field.classList.remove('hidden');
					} else {
						field.classList.add('hidden');
					}
				});

				// Hide/show category sections
				categorySections.forEach(function(section) {
					var hasVisibleFields = Array.from(section.querySelectorAll('.experiment-field')).some(function(field) {
						return !field.classList.contains('hidden');
					});

					if (hasVisibleFields) {
						section.classList.remove('hidden');
					} else {
						section.classList.add('hidden');
					}
				});
			}

			searchInput.addEventListener('input', filterExperiments);

			filterEnabledButton.addEventListener('click', function() {
				showOnlyEnabled = !showOnlyEnabled;
				if (showOnlyEnabled) {
					this.textContent = '<?php echo esc_js( __( 'Show all', 'gutenberg' ) ); ?>';
				} else {
					this.textContent = '<?php echo esc_js( __( 'Show only enabled', 'gutenberg' ) ); ?>';
				}
				filterExperiments();
			});

			toggleAllButton.addEventListener('click', function() {
				var allCheckboxes = document.querySelectorAll('input[type="checkbox"][name^="gutenberg-experiments"], input[type="checkbox"][id="active_templates"]');
				var checkedCheckboxes = document.querySelectorAll('input[type="checkbox"][name^="gutenberg-experiments"]:checked, input[type="checkbox"][id="active_templates"]:checked');
				var shouldEnable = checkedCheckboxes.length === 0;

				allCheckboxes.forEach(function(checkbox) {
					checkbox.checked = shouldEnable;
				});

				// Update badges
				experimentFields.forEach(function(field) {
					var checkbox = field.querySelector('input[type="checkbox"]');
					if (checkbox) {
						var badge = field.querySelector('.experiment-badge');
						if (badge) {
							if (shouldEnable) {
								badge.textContent = '<?php echo esc_js( __( 'Enabled', 'gutenberg' ) ); ?>';
								badge.classList.remove('disabled');
								badge.classList.add('enabled');
							} else {
								badge.textContent = '<?php echo esc_js( __( 'Disabled', 'gutenberg' ) ); ?>';
								badge.classList.remove('enabled');
								badge.classList.add('disabled');
							}
						}
					}
				});

				// Update active_templates badge if it exists
				var activeTemplatesField = document.querySelector('#active_templates')?.closest('.experiment-field');
				if (activeTemplatesField) {
					var badge = activeTemplatesField.querySelector('.experiment-badge');
					if (badge) {
						if (shouldEnable) {
							badge.textContent = '<?php echo esc_js( __( 'Enabled', 'gutenberg' ) ); ?>';
							badge.classList.remove('disabled');
							badge.classList.add('enabled');
						} else {
							badge.textContent = '<?php echo esc_js( __( 'Disabled', 'gutenberg' ) ); ?>';
							badge.classList.remove('enabled');
							badge.classList.add('disabled');
						}
					}
				}
			});

			// Check dependencies on page load and when checkboxes change
			function checkDependencies() {
				var checkboxes = document.querySelectorAll('input[type="checkbox"][name^="gutenberg-experiments"]');
				var activeTemplatesCheckbox = document.getElementById('active_templates');
				var allCheckboxes = Array.from(checkboxes);
				if (activeTemplatesCheckbox) {
					allCheckboxes.push(activeTemplatesCheckbox);
				}

				allCheckboxes.forEach(function(checkbox) {
					var field = checkbox.closest('.experiment-field');
					if (!field) return;

					var requires = field.dataset.requires;
					if (!requires) return;

					var requiredCheckbox = document.getElementById(requires);
					if (!requiredCheckbox) return;

					var warning = field.querySelector('.experiment-dependency-warning');
					if (!warning) return;

					if (checkbox.checked && !requiredCheckbox.checked) {
						warning.classList.add('show');
						checkbox.disabled = false;
					} else if (!requiredCheckbox.checked && checkbox.checked) {
						warning.classList.add('show');
					} else {
						warning.classList.remove('show');
					}
				});
			}

			// Check dependencies on checkbox change
			document.addEventListener('change', function(e) {
				if (e.target.type === 'checkbox' && (e.target.name.startsWith('gutenberg-experiments') || e.target.id === 'active_templates')) {
					checkDependencies();
				}
			});

			// Check dependencies on form submit
			document.getElementById('experiments-form').addEventListener('submit', function(e) {
				var hasInvalidDependencies = false;
				var checkboxes = document.querySelectorAll('input[type="checkbox"][name^="gutenberg-experiments"]:checked');
				
				checkboxes.forEach(function(checkbox) {
					var field = checkbox.closest('.experiment-field');
					if (!field) return;

					var requires = field.dataset.requires;
					if (!requires) return;

					var requiredCheckbox = document.getElementById(requires);
					if (requiredCheckbox && !requiredCheckbox.checked) {
						hasInvalidDependencies = true;
						checkbox.checked = false;
					}
				});

				if (hasInvalidDependencies) {
					alert('<?php echo esc_js( __( 'Some experiments were disabled because their required dependencies are not enabled.', 'gutenberg' ) ); ?>');
				}
			});

			// Initial dependency check
			checkDependencies();
		})();
		</script>
		<?php
	}
}

/**
 * Get experiment categories.
 *
 * Categories are auto-discovered from registered experiments.
 * Returns a map of category IDs to readable names.
 *
 * @return array Array of category IDs and names.
 */
function gutenberg_get_experiment_categories() {
	$definitions = gutenberg_get_experiment_definitions();
	$categories  = array(
		'uncategorized' => __( 'Uncategorized', 'gutenberg' ),
	);

	// Discover categories from experiments
	foreach ( $definitions as $experiment ) {
		$cat = isset( $experiment['category'] ) ? $experiment['category'] : 'uncategorized';
		if ( ! isset( $categories[ $cat ] ) ) {
			// Generate readable name from category ID
			$categories[ $cat ] = ucwords( str_replace( array( '-', '_' ), ' ', $cat ) );
		}
	}

	return $categories;
}

/**
 * Register a single experiment.
 *
 * Internal function used to register experiments from the definitions array.
 * Developers should add experiments to the array in `gutenberg_get_experiment_definitions()`.
 *
 * @access private
 *
 * @param string $id Experiment ID.
 * @param string $title Experiment title.
 * @param array  $args {
 *     Optional. Array of experiment arguments.
 *
 *     @type string $description  Experiment description.
 *     @type string $category      Experiment category. Default 'uncategorized'.
 *     @type string $requires      ID of required experiment.
 * }
 */
function gutenberg_register_experiment( $id, $title, $args = array() ) {
	$defaults = array(
		'description' => '',
		'category'    => 'uncategorized',
		'requires'    => '',
	);
	$args     = wp_parse_args( $args, $defaults );

	$category_id = $args['category'];
	$section_id  = 'gutenberg_experiments_section_' . $category_id;

	// Ensure the category section exists (in case it's a new category)
	global $wp_settings_sections;
	if ( ! isset( $wp_settings_sections['gutenberg-experiments'][ $section_id ] ) ) {
		// Generate readable name from category ID
		$category_name = ucwords( str_replace( array( '-', '_' ), ' ', $category_id ) );

		add_settings_section(
			$section_id,
			$category_name,
			'gutenberg_display_experiment_category_section',
			'gutenberg-experiments',
			array(
				'category_id'   => $category_id,
				'category_name' => $category_name,
			)
		);
	}

	// Use standard WordPress add_settings_field - it will be auto-discovered
	add_settings_field(
		$id,
		$title,
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		$section_id,
		array(
			'id'       => $id,
			'title'    => $title,
			'label'    => $args['description'],
			'category' => $args['category'],
			'requires' => $args['requires'],
		)
	);
}

/**
 * Set up the experiments settings.
 */
function gutenberg_initialize_experiments_settings() {
	// Categories will be auto-discovered when experiments are registered
	// We just need to ensure 'uncategorized' exists
	$categories = gutenberg_get_experiment_categories();

	// Register category sections for all discovered categories
	foreach ( $categories as $category_id => $category_name ) {
		add_settings_section(
			'gutenberg_experiments_section_' . $category_id,
			$category_name,
			'gutenberg_display_experiment_category_section',
			'gutenberg-experiments',
			array(
				'category_id'   => $category_id,
				'category_name' => $category_name,
			)
		);
	}

	// Register experiments using the new helper function
	$definitions = gutenberg_get_experiment_definitions();
	foreach ( $definitions as $experiment ) {
		gutenberg_register_experiment(
			$experiment['id'],
			$experiment['title'],
			array(
				'description' => isset( $experiment['description'] ) ? $experiment['description'] : '',
				'category'    => isset( $experiment['category'] ) ? $experiment['category'] : 'uncategorized',
				'requires'    => isset( $experiment['requires'] ) ? $experiment['requires'] : '',
			)
		);
	}

	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments'
	);
}

add_action( 'admin_init', 'gutenberg_initialize_experiments_settings' );

/**
 * Display a checkbox field for a Gutenberg experiment.
 *
 * @param array $args Experiment arguments.
 */
function gutenberg_display_experiment_field( $args ) {
	$options                              = get_option( 'gutenberg-experiments', array() );
	$value                                = isset( $options[ $args['id'] ] ) ? 1 : 0;
								$category = isset( $args['category'] ) ? $args['category'] : 'uncategorized';
	$title                                = isset( $args['title'] ) ? $args['title'] : $args['id'];
	$description                          = isset( $args['label'] ) ? $args['label'] : ( isset( $args['description'] ) ? $args['description'] : '' );
	$requires                             = isset( $args['requires'] ) ? $args['requires'] : '';

	// Get required experiment title if dependency exists
	$required_title = '';
	if ( $requires ) {
		$definitions = gutenberg_get_experiment_definitions();
		foreach ( $definitions as $def ) {
			if ( $def['id'] === $requires ) {
				$required_title = $def['title'];
				break;
			}
		}
	}

	$required_enabled = false;
	if ( $requires ) {
		$required_options = get_option( 'gutenberg-experiments', array() );
		$required_enabled = isset( $required_options[ $requires ] ) && $required_options[ $requires ];
	}
	?>
	<div class="experiment-field" data-category="<?php echo esc_attr( $category ); ?>" data-requires="<?php echo esc_attr( $requires ); ?>">
		<div class="experiment-field-header">
			<label for="<?php echo esc_attr( $args['id'] ); ?>" class="experiment-field-title">
				<input
					type="checkbox"
					name="<?php echo esc_attr( 'gutenberg-experiments[' . $args['id'] . ']' ); ?>"
					id="<?php echo esc_attr( $args['id'] ); ?>"
					value="1"
					<?php checked( 1, $value ); ?>
					<?php echo ( $requires && ! $required_enabled && $value ) ? 'disabled' : ''; ?>
				/>
				<?php echo esc_html( $title ); ?>
			</label>
			<div class="experiment-field-badges">
				<span class="experiment-badge <?php echo $value ? 'enabled' : 'disabled'; ?>">
					<?php echo $value ? esc_html__( 'Enabled', 'gutenberg' ) : esc_html__( 'Disabled', 'gutenberg' ); ?>
				</span>
			</div>
		</div>
		<?php if ( $description ) : ?>
			<div class="experiment-field-description">
				<?php echo wp_kses_post( $description ); ?>
			</div>
		<?php endif; ?>
		<?php if ( $requires ) : ?>
			<div class="experiment-field-actions">
				<div class="experiment-dependency-warning <?php echo ( $value && ! $required_enabled ) ? 'show' : ''; ?>">
					<strong><?php echo esc_html__( 'Dependency required:', 'gutenberg' ); ?></strong>
					<?php
					printf(
						/* translators: %s: Name of required experiment */
						esc_html__( 'This experiment requires "%s" to be enabled.', 'gutenberg' ),
						esc_html( $required_title ? $required_title : $requires )
					);
					?>
				</div>
			</div>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Display a category section for experiments.
 *
 * @param array $args Section arguments.
 */
function gutenberg_display_experiment_category_section( $args ) {
	$category_id   = isset( $args['category_id'] ) ? $args['category_id'] : '';
	$category_name = isset( $args['category_name'] ) ? $args['category_name'] : '';
	// Check if this is the first field in the section
	static $section_opened = array();
	$section_key           = 'gutenberg_experiments_section_' . $category_id;

	if ( ! isset( $section_opened[ $section_key ] ) ) {
		$section_opened[ $section_key ] = true;
		?>
		<div class="experiments-category-section" data-category="<?php echo esc_attr( $category_id ); ?>">
			<div class="experiments-category-header">
				<?php echo esc_html( $category_name ); ?>
			</div>
			<div class="experiments-category-content">
		<?php
	}
}

/**
 * CUSTOM FILTERS AND ACTIONS.
 */
add_action( 'admin_init', 'gutenberg_handle_template_activate_setting_submission' );
function gutenberg_handle_template_activate_setting_submission() {
	if ( ! isset( $_POST['option_page'] ) || 'gutenberg-experiments' !== $_POST['option_page'] ) {
		return;
	}

	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'gutenberg-experiments-options' ) ) {
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_POST['active_templates'] ) && '1' === $_POST['active_templates'] ) {
		update_option( 'active_templates', gutenberg_get_migrated_active_templates() );
	} else {
		delete_option( 'active_templates' );
	}
}
