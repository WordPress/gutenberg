/**
 * WordPress dependencies
 */
import { widget as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Legacy Widget (Experimental)' ),
	description: __( 'Display a legacy widget.' ),
	icon,
	edit,
	transforms,
};

/**
 * Special factory function created specifically for the legacy-widget block. For every other block, JS module exports
 * are used for registration. In case of this special block, the return value of the create function is used instead.
 *
 * The rationale is that variations of legacy-widgets block are dynamic rather than static - they can only be known once
 * the editor settings are available.
 *
 * @param {Object} editorSettings Current editor settings.
 * @return {Object} Block object.
 */
export const create = ( editorSettings ) => {
	const legacyWidgets = editorSettings?.availableLegacyWidgets ?? {};
	return {
		metadata,
		name,
		settings: {
			...settings,
			__experimentalLabel: ( { name: widgetName } ) => widgetName,
			variations: legacyWidgetsToBlockVariations( legacyWidgets ),
		},
	};
};

function legacyWidgetsToBlockVariations( availableLegacyWidgets ) {
	const variations = [];
	for ( const className in availableLegacyWidgets ) {
		const widget = availableLegacyWidgets[ className ];
		if ( widget.isHidden ) {
			continue;
		}
		variations.push( legacyWidgetToBlockVariation( className, widget ) );
	}
	return variations;
}

function legacyWidgetToBlockVariation( className, widget ) {
	const blockVariation = {
		attributes: {},
		category: 'widgets',
		description: widget.description,
		icon: settings.icon,
		name: className,
		title: widget.name,
	};

	if ( widget.isReferenceWidget ) {
		blockVariation.attributes = {
			name: widget.name,
			referenceWidgetName: className,
			instance: {},
		};
	} else {
		blockVariation.attributes = {
			name: widget.name,
			idBase: widget.id_base,
			widgetClass: className,
			instance: {},
		};
	}
	return blockVariation;
}
