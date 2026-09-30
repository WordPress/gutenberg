/**
 * Capitalizes the first letter in a string.
 *
 * @param {string} str The string whose first letter the function will capitalize.
 *
 * @return {string} Capitalized string.
 */
const upperFirst = ( [ firstLetter, ...rest ] ) =>
	firstLetter.toUpperCase() + rest.join( '' );

// Common metadata - only needed for blocks

const description = {
	type: 'input',
	message: 'The short description for your project (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

// Theme-specific prompts
const themeSlug = {
	type: 'input',
	message:
		'The theme slug used for identification (also the output folder name):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid theme slug specified. Theme slug can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const themeTitle = {
	type: 'input',
	message: 'The display title for your theme:',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const themeDescription = {
	type: 'input',
	message: 'The short description for your theme (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

// Plugin-specific prompts
const pluginSlug = {
	type: 'input',
	message:
		'The plugin slug used for identification (also the output folder name):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid plugin slug specified. Plugin slug can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const pluginTitle = {
	type: 'input',
	message: 'The display title for your plugin:',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const pluginDescription = {
	type: 'input',
	message: 'The short description for your plugin (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

// Block-specific prompts
const blockSlug = {
	type: 'input',
	message:
		'The block slug used for identification (also the output folder name):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid block slug specified. Block slug can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const blockNamespace = {
	type: 'input',
	message:
		'The internal namespace for the block name (something unique for your products):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid block namespace specified. Block namespace can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const blockTitle = {
	type: 'input',
	message: 'The display title for your block:',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const blockDescription = {
	type: 'input',
	message: 'The short description for your block (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

// Blueprint-specific prompts
const blueprintSlug = {
	type: 'input',
	message:
		'The blueprint slug used for identification (also the output folder name):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid blueprint slug specified. Blueprint slug can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const blueprintTitle = {
	type: 'input',
	message: 'The display title for your blueprint:',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const blueprintDescription = {
	type: 'input',
	message: 'The short description for your blueprint (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const blockDashicon = {
	type: 'input',
	message:
		'The dashicon to make it easier to identify your block (optional):',
	validate( input ) {
		if ( input.length && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid dashicon name specified. Visit https://developer.wordpress.org/resource/dashicons/ to discover available names.';
		}

		return true;
	},
	transformer( input ) {
		return input && input.replace( /dashicon(s)?-/, '' );
	},
};

const blockCategory = {
	type: 'select',
	message: 'The category name to help users browse and discover your block:',
	choices: [ 'text', 'media', 'design', 'widgets', 'theme', 'embed' ].map(
		( value ) => ( { value } )
	),
};

const themeTextdomain = {
	type: 'input',
	message: 'The text domain used to make strings translatable (optional):',
	validate( input ) {
		if ( input.length && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid text domain specified. Text domain can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const pluginTextdomain = {
	type: 'input',
	message: 'The text domain used to make strings translatable (optional):',
	validate( input ) {
		if ( input.length && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid text domain specified. Text domain can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const blockTextdomain = {
	type: 'input',
	message:
		'The text domain used to make strings translatable in the block (optional):',
	validate( input ) {
		if ( input.length && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid text domain specified. Text domain can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

// Plugin header fields.
const pluginURI = {
	type: 'input',
	message:
		'The home page of the plugin (optional). Unique URL outside of WordPress.org:',
};

const version = {
	type: 'input',
	message: 'The current version number of the project:',
	validate( input ) {
		// Regular expression was copied from https://semver.org.
		const validSemVerPattern =
			/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
		if ( ! validSemVerPattern.test( input ) ) {
			return 'Invalid Semantic Version provided. Visit https://regex101.com/r/vkijKf/1/ to discover all valid patterns.';
		}

		return true;
	},
};

const author = {
	type: 'input',
	message:
		'The name of the project author (optional). Multiple authors may be listed using commas:',
};

const license = {
	type: 'input',
	message: "The short name of the project's license (optional):",
};

const licenseURI = {
	type: 'input',
	message: 'A link to the full text of the license (optional):',
};

const domainPath = {
	type: 'input',
	message: 'A custom domain path for the translations (optional):',
};

const updateURI = {
	type: 'input',
	message: 'A custom update URI for the plugin (optional):',
};

// Theme-specific prompts
const themeURI = {
	type: 'input',
	message:
		'The home page of the theme (optional). Unique URL outside of WordPress.org:',
};

const themeRequiresWP = {
	type: 'input',
	message: 'The minimum WordPress version required (optional):',
	validate( input ) {
		if ( input.length && ! /^\d+\.\d+(\.\d+)?$/.test( input ) ) {
			return 'Invalid WordPress version. Use format like "6.0" or "6.0.1".';
		}
		return true;
	},
};

const requiresPHP = {
	type: 'input',
	message: 'The minimum PHP version required (optional):',
	validate( input ) {
		if ( input.length && ! /^\d+\.\d+(\.\d+)?$/.test( input ) ) {
			return 'Invalid PHP version. Use format like "7.4" or "8.0.1".';
		}
		return true;
	},
};

const themeTags = {
	type: 'input',
	message: 'Theme tags (comma-separated, optional):',
	transformer( input ) {
		return (
			input &&
			input
				.split( ',' )
				.map( ( tag ) => tag.trim() )
				.join( ', ' )
		);
	},
};

// Blueprint-specific prompts
const siteTitle = {
	type: 'input',
	message: 'Site title for the blueprint (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const plugins = {
	type: 'input',
	message: 'WordPress plugins to install (comma-separated slugs, optional):',
	transformer( input ) {
		if ( Array.isArray( input ) ) {
			return input.join( ', ' );
		}
		return (
			input &&
			input
				.split( ',' )
				.map( ( p ) => p.trim() )
				.filter( Boolean )
				.join( ', ' )
		);
	},
};

const themes = {
	type: 'input',
	message: 'WordPress themes to install (comma-separated slugs, optional):',
	transformer( input ) {
		return (
			input &&
			input
				.split( ',' )
				.map( ( t ) => t.trim() )
				.filter( Boolean )
				.join( ', ' )
		);
	},
};

const wpVersion = {
	type: 'select',
	message: 'Preferred WordPress version:',
	choices: [
		{ name: 'Latest', value: 'latest' },
		{ name: '6.7', value: '6.7' },
		{ name: '6.6', value: '6.6' },
		{ name: '6.5', value: '6.5' },
		{ name: '6.4', value: '6.4' },
		{ name: '6.3', value: '6.3' },
		{ name: '6.2', value: '6.2' },
		{ name: '6.1', value: '6.1' },
		{ name: '6.0', value: '6.0' },
	],
	default: 'latest',
};

const phpVersion = {
	type: 'select',
	message: 'Preferred PHP version:',
	choices: [
		{ name: 'Latest', value: 'latest' },
		{ name: '8.4', value: '8.4' },
		{ name: '8.3', value: '8.3' },
		{ name: '8.2', value: '8.2' },
		{ name: '8.1', value: '8.1' },
		{ name: '8.0', value: '8.0' },
		{ name: '7.4', value: '7.4' },
		{ name: '7.3', value: '7.3' },
		{ name: '7.2', value: '7.2' },
	],
};

const landingPage = {
	type: 'input',
	message: 'Landing page URL (optional, defaults to "/wp-admin/"):',
	validate( input ) {
		if ( input.length && ! input.startsWith( '/' ) ) {
			return 'Landing page URL must start with "/".';
		}
		return true;
	},
};

const login = {
	type: 'confirm',
	message: 'Should the blueprint automatically log in users?',
};

const networking = {
	type: 'confirm',
	message: 'Enable networking support (wp_safe_remote_get)?',
};

const resetData = {
	type: 'confirm',
	message: 'Reset data before running the blueprint?',
};

const metaTitle = {
	type: 'input',
	message: 'Blueprint title for metadata (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const metaDescription = {
	type: 'input',
	message: 'Blueprint description for metadata (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const metaAuthor = {
	type: 'input',
	message: 'GitHub username of blueprint author (optional):',
	validate( input ) {
		if (
			input.length &&
			! /^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/.test( input )
		) {
			return 'Invalid GitHub username format.';
		}
		return true;
	},
};

const metaCategories = {
	type: 'input',
	message: 'Blueprint categories (comma-separated, optional):',
	transformer( input ) {
		return (
			input &&
			input
				.split( ',' )
				.map( ( c ) => c.trim() )
				.filter( Boolean )
				.join( ', ' )
		);
	},
};

const extraLibraries = {
	type: 'checkbox',
	message: 'Extra libraries to include:',
	choices: [ { name: 'WP-CLI', value: 'wp-cli' } ],
};

const siteOptions = {
	type: 'confirm',
	message: 'Do you want to configure site options?',
	default: false,
};

const blogname = {
	type: 'input',
	message: 'Site title (blogname):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const blogdescription = {
	type: 'input',
	message: 'Site tagline (blogdescription):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const adminEmail = {
	type: 'input',
	message: 'Admin email address:',
	validate( input ) {
		if ( input.length && ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( input ) ) {
			return 'Please enter a valid email address.';
		}
		return true;
	},
};

const startOfWeek = {
	type: 'select',
	message: 'Start of week:',
	choices: [
		{ name: 'Sunday', value: '0' },
		{ name: 'Monday', value: '1' },
		{ name: 'Tuesday', value: '2' },
		{ name: 'Wednesday', value: '3' },
		{ name: 'Thursday', value: '4' },
		{ name: 'Friday', value: '5' },
		{ name: 'Saturday', value: '6' },
	],
	default: '1',
};

const timezone = {
	type: 'input',
	message: 'Timezone (e.g., America/New_York, Europe/London):',
	validate( input ) {
		if ( input.length && ! /^[A-Za-z_]+\/[A-Za-z_]+$/.test( input ) ) {
			return 'Please enter a valid timezone in format Continent/City.';
		}
		return true;
	},
};

const constants = {
	type: 'confirm',
	message: 'Do you want to configure PHP constants?',
	default: false,
};

const wpDebug = {
	type: 'confirm',
	message: 'Enable WP_DEBUG?',
	default: false,
};

const wpDebugLog = {
	type: 'confirm',
	message: 'Enable WP_DEBUG_LOG?',
	default: false,
};

const wpDebugDisplay = {
	type: 'confirm',
	message: 'Enable WP_DEBUG_DISPLAY?',
	default: false,
};

const scriptDebug = {
	type: 'confirm',
	message: 'Enable SCRIPT_DEBUG?',
	default: false,
};

const wpCacheEnabled = {
	type: 'confirm',
	message: 'Enable WP_CACHE?',
	default: false,
};

const disallowFileEdit = {
	type: 'confirm',
	message: 'Disable file editing (DISALLOW_FILE_EDIT)?',
	default: false,
};

const wpMemoryLimit = {
	type: 'input',
	message: 'WordPress memory limit (e.g., 256M, 512M):',
	validate( input ) {
		if ( input.length && ! /^\d+[MG]$/.test( input ) ) {
			return 'Please enter a valid memory limit (e.g., 256M, 512M, 1G).';
		}
		return true;
	},
};

module.exports = {
	// Common prompts
	description,
	version,
	author,
	license,
	licenseURI,
	requiresPHP,
	// Theme-specific prompts
	themeSlug,
	themeTitle,
	themeDescription,
	themeTextdomain,
	themeURI,
	themeRequiresWP,
	themeTags,
	// Plugin-specific prompts
	pluginSlug,
	pluginTitle,
	pluginDescription,
	pluginTextdomain,
	pluginURI,
	domainPath,
	updateURI,
	// Block-specific prompts
	blockSlug,
	blockNamespace,
	blockTitle,
	blockDescription,
	blockTextdomain,
	blockDashicon,
	blockCategory,
	// Blueprint-specific prompts
	blueprintSlug,
	blueprintTitle,
	blueprintDescription,
	siteTitle,
	plugins,
	themes,
	wpVersion,
	phpVersion,
	landingPage,
	login,
	networking,
	resetData,
	metaTitle,
	metaDescription,
	metaAuthor,
	metaCategories,
	extraLibraries,
	siteOptions,
	constants,
	// Site option prompts
	blogname,
	blogdescription,
	adminEmail,
	startOfWeek,
	timezone,
	// Constant prompts
	wpDebug,
	wpDebugLog,
	wpDebugDisplay,
	scriptDebug,
	wpCacheEnabled,
	disallowFileEdit,
	wpMemoryLimit,
};
