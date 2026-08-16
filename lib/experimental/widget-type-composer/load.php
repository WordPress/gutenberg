<?php
/**
 * Widget Type Composer: experiment entry point.
 *
 * Loaded from `lib/load.php` only when the `gutenberg-widget-type-composer`
 * experiment is enabled. It builds on the New Dashboard experience
 * (`gutenberg-dashboard-widgets`): the widget type registry, its REST
 * exposure, and the client discovery hook.
 *
 * This is an inert scaffold. Each subsequent step adds its `require` here, so
 * the feature's PHP surface is assembled in one place and stays gated behind
 * the experiment.
 *
 * @package gutenberg
 */

// Server-defined widget definitions (code-registered now; CPT origin added later).
require_once __DIR__ . '/widget-definitions.php';
