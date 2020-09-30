/**
 * WordPress dependencies
 */
import { widget as icon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

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

const blockBasis = {
	metadata,
	name,
	settings,
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
	const legacyWidgets = Object.entries(
		editorSettings.availableLegacyWidgets
	).filter( ( [ , widget ] ) => ! widget.isHidden );

	return [
		{
			...blockBasis,
			settings: {
				...blockBasis.settings,
				variations: legacyWidgets
					.filter( ( [ , widget ] ) => ! widget.isReferenceWidget )
					.map( ( [ className, widget ] ) =>
						legacyWidgetToBlockVariation( className, widget )
					),
			},
		},
		...legacyWidgets
			.filter( ( [ , widget ] ) => widget.isReferenceWidget )
			.map( ( [ className, widget ] ) =>
				referenceLegacyWidgetsToBlockType( className, widget )
			),
	];
};

function referenceLegacyWidgetsToBlockType( className, widget ) {
	const attrs = blockBasis.metadata.attributes;
	return {
		...blockBasis,
		name: widget.blockName,
		metadata: {
			...blockBasis.metadata,
			name: widget.blockName,
			supports: {
				...blockBasis.metadata.supports,
				multiple: false,
			},
			attributes: {
				...attrs,
				referenceWidgetName: {
					...attrs.referenceWidgetName,
					default: className,
				},
				instance: {
					...attrs.instance,
					default: {},
				},
			},
		},
		settings: {
			...blockBasis.settings,
			title: widget.name,
			// translators: %s: widget label e.g: "Marquee".
			description: sprintf( __( 'Displays a %s widget' ), widget.name ),
		},
	};
}

function legacyWidgetToBlockVariation( className, widget ) {
	return {
		attributes: {
			idBase: widget.id_base,
			widgetClass: className,
			instance: {},
		},
		category: 'widgets',
		description: widget.description,
		icon: settings.icon,
		name: className,
		title: widget.name,
	};
}
