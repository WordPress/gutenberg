/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFormat, removeFormat } from '@wordpress/rich-text';

const FORMAT_NAME = 'core/annotation';

const ANNOTATION_ATTRIBUTE_PREFIX = 'annotation-text-';
const STORE_KEY = 'core/annotations';

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

		const className = ANNOTATION_ATTRIBUTE_PREFIX + annotation.source;
		const id = ANNOTATION_ATTRIBUTE_PREFIX + annotation.id;

		record = applyFormat(
			record,
			{
				type: FORMAT_NAME, attributes: {
					className,
					id,
				},
			},
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

/**
 * Retrieves the positions of annotations inside an array of formats.
 *
 * @param {Array} formats Formats with annotations in there.
 * @return {Object} ID keyed positions of annotations.
 */
function retrieveAnnotationPositions( formats ) {
	const positions = {};

	formats.forEach( ( characterFormats, i ) => {
		characterFormats = characterFormats || [];
		characterFormats = characterFormats.filter( ( format ) => format.type === FORMAT_NAME );
		characterFormats.forEach( ( format ) => {
			let { id } = format.attributes;
			id = id.replace( ANNOTATION_ATTRIBUTE_PREFIX, '' );

			if ( ! positions.hasOwnProperty( id ) ) {
				positions[ id ] = {
					start: i,
				};
			}

			// Annotations refer to positions between characters.
			// Formats refer to the character themselves.
			// So we need to adjust for that here.
			positions[ id ].end = i + 1;
		} );
	} );

	return positions;
}

/**
 * Updates annotations in the state based on positions retrieved from RichText.
 *
 * @param {Array}    annotations           The annotations that are currently applied.
 * @param {Array}    positions             The current positions of the given annotations.
 * @param {Function} removeAnnotation      Function to remove an annotation from the state.
 * @param {Function} updateAnnotationRange Function to update an annotation range in the state.
 */
function updateAnnotationsWithPositions( annotations, positions, { removeAnnotation, updateAnnotationRange } ) {
	annotations.forEach( ( currentAnnotation ) => {
		const position = positions[ currentAnnotation.id ];
		// If we cannot find an annotation, delete it.
		if ( ! position ) {
			// Apparently the annotation has been removed, so remove it from the state:
			// Remove...
			removeAnnotation( currentAnnotation.id );
			return;
		}

		const { start, end } = currentAnnotation;
		if ( start !== position.start || end !== position.end ) {
			updateAnnotationRange( currentAnnotation.id, position.start, position.end );
		}
	} );
}

export const annotation = {
	name: FORMAT_NAME,
	title: __( 'Annotation' ),
	tagName: 'mark',
	className: 'annotation-text',
	attributes: {
		className: 'class',
		id: 'id',
	},
	edit() {
		return null;
	},
	__experimentalGetPropsForEditableTreePreparation( select, { richTextIdentifier, blockClientId } ) {
		return {
			annotations: select( STORE_KEY ).__experimentalGetAnnotationsForRichText( blockClientId, richTextIdentifier ),
		};
	},
	__experimentalCreatePrepareEditableTree( { annotations } ) {
		return ( formats, text ) => {
			if ( annotations.length === 0 ) {
				return formats;
			}

			let record = { formats, text };
			record = applyAnnotations( record, annotations );
			return record.formats;
		};
	},
	__experimentalGetPropsForEditableTreeChangeHandler( dispatch ) {
		return {
			removeAnnotation: dispatch( STORE_KEY ).__experimentalRemoveAnnotation,
			updateAnnotationRange: dispatch( STORE_KEY ).__experimentalUpdateAnnotationRange,
		};
	},
	__experimentalCreateOnChangeEditableValue( props ) {
		return ( formats ) => {
			const positions = retrieveAnnotationPositions( formats );
			const { removeAnnotation, updateAnnotationRange, annotations } = props;

			updateAnnotationsWithPositions( annotations, positions, { removeAnnotation, updateAnnotationRange } );
		};
	},
};
