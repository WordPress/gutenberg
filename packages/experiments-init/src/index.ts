/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';
import { __ } from '@wordpress/i18n';

/**
 * Experiment definitions.
 *
 * These are the same definitions as in lib/experiments-page.php.
 * In a production setup, these would ideally come from a REST endpoint
 * or be injected by PHP, but for the boot system we define them here.
 */
const experimentDefinitions = [
	{
		id: 'gutenberg-block-experiments',
		name: 'Experimental Blocks',
		description:
			'Enables experimental blocks on a rolling basis as they are developed.',
		warning:
			'These blocks may have significant changes during development that cause validation errors and display issues.',
		category: 'blocks',
		icon: 'blockDefault',
	},
	{
		id: 'gutenberg-form-blocks',
		name: 'Form & Input Blocks',
		description: 'Enables new blocks to allow building forms.',
		warning:
			'You are likely to experience UX issues that are being addressed.',
		category: 'blocks',
		icon: 'postComments',
	},
	{
		id: 'gutenberg-grid-interactivity',
		name: 'Grid Interactivity',
		description:
			'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.',
		category: 'blocks',
		icon: 'grid',
	},
	{
		id: 'gutenberg-no-tinymce',
		name: 'Disable TinyMCE',
		description: 'Disables the TinyMCE and Classic block.',
		category: 'blocks',
		icon: 'cancelCircleFilled',
	},
	{
		id: 'gutenberg-media-processing',
		name: 'Client-side Media Processing',
		description:
			"Enables client-side media processing to leverage the browser's capabilities to handle tasks like image resizing and compression.",
		category: 'editor',
		icon: 'image',
	},
	{
		id: 'gutenberg-sync-collaboration',
		name: 'Real-time Collaboration',
		description:
			'Enables live collaboration and offline persistence between peers.',
		category: 'editor',
		icon: 'people',
	},
	{
		id: 'gutenberg-color-randomizer',
		name: 'Color Randomizer',
		description:
			'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.',
		category: 'editor',
		icon: 'color',
	},
	{
		id: 'gutenberg-quick-edit-dataviews',
		name: 'Quick Edit',
		description:
			'Enables access to a Quick Edit panel in the Site Editor Pages experience.',
		category: 'editor',
		icon: 'pencil',
	},
	{
		id: 'gutenberg-dataviews-media-modal',
		name: 'New Media Modal',
		description:
			'Enables a new media modal experience powered by Data Views for improved media library management.',
		category: 'editor',
		icon: 'gallery',
	},
	{
		id: 'gutenberg-workflow-palette',
		name: 'Workflow Palette',
		description:
			'Enables the Workflow Palette for running workflows composed of abilities, from a unified interface.',
		category: 'editor',
		icon: 'tool',
	},
	{
		id: 'gutenberg-customizable-navigation-overlays',
		name: 'Customizable Navigation Overlays',
		description:
			'Enables custom mobile overlay design and content control for Navigation blocks, allowing you to create flexible, professional menu experiences.',
		category: 'editor',
		icon: 'navigation',
	},
	{
		id: 'gutenberg-full-page-client-side-navigation',
		name: 'Full-page Client-side Navigation',
		description:
			'Enables full-page client-side navigation, powered by the Interactivity API.',
		category: 'advanced',
		icon: 'globe',
	},
	{
		id: 'gutenberg-content-only-pattern-insertion',
		name: 'Content-only Patterns',
		description:
			'When patterns are inserted, default to a simplified content only mode for editing pattern content.',
		category: 'advanced',
		icon: 'layout',
	},
	{
		id: 'gutenberg-content-only-inspector-fields',
		name: 'Block Fields',
		description:
			'Enables editable block inspector fields that are generated using a dataform.',
		category: 'advanced',
		icon: 'settings',
	},
	{
		id: 'gutenberg-hide-blocks-based-on-screen-size',
		name: 'Hide Blocks by Screen Size',
		description:
			'Extends block visibility block supports with responsive design controls for hiding blocks based on screen size.',
		category: 'advanced',
		icon: 'mobile',
	},
	{
		id: 'gutenberg-extensible-site-editor',
		name: 'Extensible Site Editor',
		description:
			'Redirects the default site editor (Appearance > Design) to use the extensible site editor page.',
		category: 'advanced',
		icon: 'plugins',
	},
	{
		id: 'active_templates',
		name: 'Template Activation',
		description:
			'Allows multiple templates of the same type to be created, of which one can be active at a time.',
		warning:
			'When you deactivate this experiment, it is best to delete all created templates except for the active ones.',
		category: 'advanced',
		learnMore: 'https://github.com/WordPress/gutenberg/issues/66950',
		icon: 'layout',
	},
];

/**
 * Initialize the experiments page.
 * This function is mandatory - all init modules must export 'init'.
 */
export async function init() {
	// Register experiment definitions globally so the route can access them
	( window as any ).gutenbergExperimentDefinitions = experimentDefinitions;

	// Configure the sidebar header for this page
	dispatch( bootStore ).setPageConfig( {
		title: __( 'Experiments' ),
		description: __(
			'Enable experimental features that are still in development. These features may change or be removed in future versions.'
		),
	} );
}
