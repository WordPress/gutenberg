/**
 * External dependencies
 */
import { readdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Get all widget names from the widgets directory.
 *
 * @param {string} rootDir Root directory of the project.
 * @return {string[]} Array of widget directory names.
 */
export function getAllWidgets( rootDir ) {
	const widgetsPath = path.join( rootDir, 'widgets' );

	try {
		return readdirSync( widgetsPath, { withFileTypes: true } )
			.filter( ( dirent ) => dirent.isDirectory() )
			.map( ( dirent ) => dirent.name );
	} catch {
		// Widgets directory doesn't exist, return empty array
		return [];
	}
}

/**
 * @typedef {Object} WidgetHelpLinkMetadata
 * @property {string} label Link label.
 * @property {string} href  Link destination.
 */

/**
 * @typedef {Object} WidgetHelpMetadata
 * @property {string}                   content Help content; may carry `em`/`strong`.
 * @property {WidgetHelpLinkMetadata[]} [links] Links contextual to the note.
 */

/**
 * @typedef {Object} WidgetActionMetadata
 * @property {string}         id             Stable identifier, local to the widget type.
 * @property {string}         label          Human-readable label. Translatable.
 * @property {string}         href           Destination the action points at.
 * @property {string|boolean} [download]     Download the destination; a string sets the filename.
 * @property {boolean}        [openInNewTab] Open the destination in a new browser tab.
 */

/**
 * @typedef {Object} WidgetMetadata
 * @property {string}                                    name           Widget namespaced identifier.
 * @property {string}                                    [title]        Human-readable title.
 * @property {string}                                    [description]  Short description.
 * @property {WidgetHelpMetadata}                        [help]         Contextual help note for compact surfaces.
 * @property {WidgetActionMetadata[]}                    [actions]      Declarative actions the widget exposes.
 * @property {string}                                    [category]     Grouping category.
 * @property {'framed' | 'content-bleed' | 'full-bleed'} [presentation] Authoring intent about how the widget wants to render.
 * @property {string[]}                                  [keywords]     Search aliases used to match the widget.
 * @property {string}                                    [textdomain]   Gettext text domain for translations.
 */

/**
 * Get widget metadata from widget.json.
 *
 * @param {string} rootDir    Root directory of the project.
 * @param {string} widgetName Widget name.
 * @return {WidgetMetadata|null} Widget metadata object or null if not found.
 */
export function getWidgetMetadata( rootDir, widgetName ) {
	const widgetJsonPath = path.join(
		rootDir,
		'widgets',
		widgetName,
		'widget.json'
	);

	if ( ! existsSync( widgetJsonPath ) ) {
		return null;
	}

	let metadata;
	try {
		metadata = /** @type {WidgetMetadata} */ (
			JSON.parse( readFileSync( widgetJsonPath, 'utf8' ) )
		);
	} catch {
		return null;
	}

	if ( ! metadata || ! metadata.name ) {
		return null;
	}

	return metadata;
}

/**
 * Gettext context for each translatable `widget.json` metadata value.
 *
 * Must match the widget i18n schema the runtime translation uses on the
 * hydrated registry (`lib/experimental/dashboard-widgets/widget-i18n.json`):
 * the lookups are context-qualified, so a drifted context makes every one
 * of them miss. Covered by a sync test in `test/widget-strings.js`.
 */
export const WIDGET_I18N_CONTEXTS = {
	title: 'widget title',
	description: 'widget description',
	helpContent: 'widget help content',
	helpLinkLabel: 'widget help link label',
	actionLabel: 'widget action label',
	keyword: 'widget keyword',
};

/**
 * @typedef {Object} WidgetTranslatableFields
 * @property {string|null}                 [title]       Human-readable title.
 * @property {string|null}                 [description] Short description.
 * @property {WidgetHelpMetadata|null}     [help]        Contextual help note.
 * @property {WidgetActionMetadata[]|null} [actions]     Declarative actions.
 * @property {string[]|null}               [keywords]    Search aliases.
 */

/**
 * Collect the translatable strings a widget declares, paired with the
 * gettext context the runtime translation resolves them under.
 *
 * @param {WidgetTranslatableFields} metadata Widget metadata fields.
 * @return {Array<{ value: string, context: string }>} Translatable entries.
 */
export function collectWidgetTranslatableStrings( metadata ) {
	/** @type {Array<{ value: string, context: string }>} */
	const entries = [];

	/**
	 * @param {unknown} value   Candidate value.
	 * @param {string}  context Gettext context.
	 */
	const add = ( value, context ) => {
		if ( typeof value === 'string' && value !== '' ) {
			entries.push( { value, context } );
		}
	};

	add( metadata.title, WIDGET_I18N_CONTEXTS.title );
	add( metadata.description, WIDGET_I18N_CONTEXTS.description );
	add( metadata.help?.content, WIDGET_I18N_CONTEXTS.helpContent );
	for ( const link of metadata.help?.links ?? [] ) {
		add( link?.label, WIDGET_I18N_CONTEXTS.helpLinkLabel );
	}
	for ( const action of metadata.actions ?? [] ) {
		add( action?.label, WIDGET_I18N_CONTEXTS.actionLabel );
	}
	for ( const keyword of metadata.keywords ?? [] ) {
		add( keyword, WIDGET_I18N_CONTEXTS.keyword );
	}

	return entries;
}

/**
 * Supported source extensions for widget entry files, in priority order.
 * Must stay aligned with SOURCE_EXTENSIONS in build.mjs.
 */
const WIDGET_EXTENSIONS = [ 'tsx', 'ts', 'jsx', 'js', 'mjs' ];

/**
 * @typedef {Object} WidgetFiles
 * @property {boolean} hasRender Whether render entry file exists.
 * @property {boolean} hasWidget Whether widget entry file exists.
 */

/**
 * Check if a widget has specific files.
 *
 * @param {string} widgetDirectory Widget directory path.
 * @return {WidgetFiles} Object with boolean flags for widget files.
 */
export function getWidgetFiles( widgetDirectory ) {
	const entries = readdirSync( widgetDirectory );

	/** @param {string} baseName */
	const hasEntry = ( baseName ) =>
		WIDGET_EXTENSIONS.some( ( ext ) =>
			entries.includes( `${ baseName }.${ ext }` )
		);

	return {
		hasRender: hasEntry( 'render' ),
		hasWidget: hasEntry( 'widget' ),
	};
}
