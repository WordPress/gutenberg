/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFormat, removeFormat } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { __experimentalRemoveAnnotation, __experimentalUpdateAnnotationRange } from '../store/actions';
import store from '../store';

const FORMAT_NAME = 'core/annotation';

const ANNOTATION_ATTRIBUTE_PREFIX = 'annotation-text-';

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
 * @param {Array} annotations The annotations that are currently applied.
 * @param {Array} positions The current positions of the given annotations.
 */
function updateAnnotationsWithPositions( annotations, positions ) {
	annotations.forEach( ( currentAnnotation ) => {
		const position = positions[ currentAnnotation.id ];
		// If we cannot find an annotation, delete it.
		if ( ! position ) {
			// Apparently the annotation has been removed, so remove it from the state:
			// Remove...
			store.dispatch( __experimentalRemoveAnnotation( currentAnnotation.id ) );
		}

		const { start, end } = currentAnnotation;
		if ( start !== position.start || end !== position.end ) {
			// Moving annotation...

			store.dispatch( __experimentalUpdateAnnotationRange( currentAnnotation.id, position.start, position.end ) );
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
		return select( 'core/annotations' ).__experimentalGetAnnotationsForRichText( blockClientId, richTextIdentifier );
	},
	__experimentalCreateFormatToValue( annotations ) {
		return ( value ) => {
			if ( annotations.length === 0 ) {
				return value;
			}

			value = applyAnnotations( value, annotations );

			return value;
		};
	},
	__experimentalCreateValueToFormat( annotations ) {
		return ( value ) => {
			const positions = retrieveAnnotationPositions( value.formats );
			updateAnnotationsWithPositions( annotations, positions );

			return removeAnnotations( value );
		};
	},
};
