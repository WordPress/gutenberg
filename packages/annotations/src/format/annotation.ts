/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFormat, removeFormat } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store/constants';
import type { Annotation, AnnotationFormat } from '../types';

const FORMAT_NAME = 'core/annotation';

const ANNOTATION_ATTRIBUTE_PREFIX = 'annotation-text-';

/**
 * Applies given annotations to the given record.
 *
 * @param record      The record to apply annotations to.
 * @param annotations The annotation to apply.
 * @return A record with the annotations applied.
 */
export function applyAnnotations(
	record: RichTextValue,
	annotations: Annotation[] = []
): RichTextValue {
	annotations.forEach( ( annotation ) => {
		let { start, end } = annotation;

		if ( typeof start !== 'number' || typeof end !== 'number' ) {
			return;
		}

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
				type: FORMAT_NAME,
				attributes: {
					className,
					id,
				},
			} as any,
			start,
			end
		);
	} );

	return record;
}

/**
 * Removes annotations from the given record.
 *
 * @param record Record to remove annotations from.
 * @return The cleaned record.
 */
export function removeAnnotations( record: RichTextValue ): RichTextValue {
	return removeFormat( record, 'core/annotation', 0, record.text.length );
}

/**
 * Retrieves the positions of annotations inside an array of formats.
 *
 * @param formats Formats with annotations in there.
 * @return ID keyed positions of annotations.
 */
function retrieveAnnotationPositions(
	formats: any[][]
): Record< string, { start: number; end?: number } > {
	const positions: Record< string, { start: number; end?: number } > = {};

	formats.forEach( ( characterFormats, i ) => {
		characterFormats = characterFormats || [];
		characterFormats = characterFormats.filter(
			( format ) => format.type === FORMAT_NAME
		);
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
 * @param annotations                   The annotations that are currently applied.
 * @param positions                     The current positions of the given annotations.
 * @param actions
 * @param actions.removeAnnotation      Function to remove an annotation from the state.
 * @param actions.updateAnnotationRange Function to update an annotation range in the state.
 */
function updateAnnotationsWithPositions(
	annotations: Annotation[],
	positions: Record< string, { start: number; end?: number } >,
	{
		removeAnnotation,
		updateAnnotationRange,
	}: {
		removeAnnotation: ( annotationId: string ) => void;
		updateAnnotationRange: (
			annotationId: string,
			start: number,
			end: number
		) => void;
	}
): void {
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
		if (
			typeof start === 'number' &&
			typeof end === 'number' &&
			( start !== position.start ||
				end !== ( position.end ?? position.start ) )
		) {
			updateAnnotationRange(
				currentAnnotation.id,
				position.start,
				position.end ?? position.start
			);
		}
	} );
}

export const annotation: AnnotationFormat = {
	name: FORMAT_NAME,
	title: __( 'Annotation' ),
	tagName: 'mark',
	className: 'annotation-text',
	attributes: {
		className: 'class',
		id: 'id',
	},
	interactive: false,
	object: false,
	edit: () => {
		return null;
	},
	__experimentalGetPropsForEditableTreePreparation: (
		select,
		{ richTextIdentifier, blockClientId }
	) => {
		return {
			annotations: select(
				STORE_NAME
			).__experimentalGetAnnotationsForRichText(
				blockClientId,
				richTextIdentifier
			),
		};
	},
	__experimentalCreatePrepareEditableTree: ( { annotations } ) => {
		return ( formats, text ) => {
			if ( annotations.length === 0 ) {
				return formats;
			}

			let record: RichTextValue = {
				formats,
				text,
				replacements: [],
				start: 0,
				end: 0,
			};
			record = applyAnnotations( record, annotations );
			return record.formats;
		};
	},
	__experimentalGetPropsForEditableTreeChangeHandler: ( dispatch ) => {
		return {
			removeAnnotation:
				dispatch( STORE_NAME ).__experimentalRemoveAnnotation,
			updateAnnotationRange:
				dispatch( STORE_NAME ).__experimentalUpdateAnnotationRange,
		};
	},
	__experimentalCreateOnChangeEditableValue: ( props ) => {
		return ( formats ) => {
			const positions = retrieveAnnotationPositions( formats );
			const { removeAnnotation, updateAnnotationRange, annotations } =
				props;

			updateAnnotationsWithPositions( annotations, positions, {
				removeAnnotation,
				updateAnnotationRange,
			} );
		};
	},
};
