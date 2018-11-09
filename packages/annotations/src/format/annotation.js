/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'core/annotation';

/* WordPress dependencies */
import { applyFormat, removeFormat } from '@wordpress/rich-text';

/**
 * Applies given annotations to the given record.
 *
 * @param {Object} record The record to apply annotations to.
 * @param {Array} annotations The annotation to apply.
 * @return {Object} A record with the annotations applied.
 */

export function applyAnnotations( record, annotations = [] ) {
	annotations.forEach( ( annotation ) => {
		let { start, end } = annotation;

		if ( start > record.text.length ) {
			start = record.text.length;
		}

		if ( end > record.text.length ) {
			end = record.text.length;
		}

		const className = 'annotation-text-' + annotation.source;

		record = applyFormat(
			record,
			{ type: 'core/annotation', attributes: { className } },
			start,
			end
		);
	} );

	return record;
}

/**
 * Removes annotations from the given record.
 *
 * @param {Object} record Record to remove annotations from.
 * @return {Object} The cleaned record.
 */
export function removeAnnotations( record ) {
	return removeFormat( record, 'core/annotation', 0, record.text.length );
}

export const annotation = {
	name,
	title: __( 'Annotation' ),
	tagName: 'mark',
	className: 'annotation-text',
	attributes: {
		className: 'class',
	},
	edit() {
		return null;
	},
	__experimentalGetPropsForEditableTreePreparation( select, { richTextIdentifier, blockClientId } ) {
		return {
			annotations: select( 'core/annotations' ).__experimentalGetAnnotationsForRichText( blockClientId, richTextIdentifier ),
		};
	},
	__experimentalCreatePrepareEditableTree( props ) {
		return ( formats, text ) => {
			if ( props.annotations.length === 0 ) {
				return formats;
			}

			let record = { formats, text };
			record = applyAnnotations( record, props.annotations );
			return record.formats;
		};
	},
};
