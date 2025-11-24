/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import { OverlayToggleContext } from './use-overlay-toggle-control';

/**
 * Parses a template part ID (format: theme//slug) into theme and slug.
 *
 * @param {string} templatePartId Template part ID.
 * @return {{theme: string, slug: string}|null} Parsed theme and slug, or null if invalid.
 */
function parseTemplatePartId( templatePartId ) {
	if ( ! templatePartId ) {
		return null;
	}
	const parts = templatePartId.split( '//' );
	if ( parts.length !== 2 ) {
		return null;
	}
	return {
		theme: parts[ 0 ],
		slug: parts[ 1 ],
	};
}

export default function OverlayTemplatePartInnerBlocks( {
	overlayTemplatePartId,
	onClose,
} ) {
	// Parse the template part ID to get theme and slug
	const templatePartAttrs = useMemo( () => {
		const parsed = parseTemplatePartId( overlayTemplatePartId );
		if ( ! parsed ) {
			return null;
		}
		return {
			slug: parsed.slug,
			theme: parsed.theme,
			area: 'overlay',
		};
	}, [ overlayTemplatePartId ] );

	// Create a template part block template with lock attribute
	const template = useMemo( () => {
		if ( ! templatePartAttrs ) {
			return [];
		}
		return [
			[
				'core/template-part',
				{
					...templatePartAttrs,
					lock: {
						remove: true,
						move: true,
					},
				},
			],
		];
	}, [ templatePartAttrs ] );

	return (
		<OverlayToggleContext.Provider value={ onClose }>
			<div className="wp-block-navigation__container">
				<InnerBlocks template={ template } templateLock={ false } />
			</div>
		</OverlayToggleContext.Provider>
	);
}
