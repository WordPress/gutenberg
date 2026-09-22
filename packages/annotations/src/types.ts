/**
 * Represents a range in text content.
 */
export interface AnnotationRange {
	/** The offset where the annotation should start. */
	start: number;
	/** The offset where the annotation should end. */
	end: number;
}

/**
 * Represents an annotation selector type.
 */
export type AnnotationSelector = 'range' | 'block';

/**
 * Base annotation interface.
 */
export interface Annotation {
	/** Unique identifier for the annotation. */
	id: string;
	/** The block client ID this annotation applies to. */
	blockClientId: string;
	/** The source that created this annotation. */
	source: string;
	/** The type of selector used for this annotation. */
	selector: AnnotationSelector;
	/** Rich text identifier for range annotations. */
	richTextIdentifier?: string | null;
	/** Range for range-based annotations. */
	range?: AnnotationRange | null;
	/** Start position for annotations returned from selectors. */
	start?: number;
	/** End position for annotations returned from selectors. */
	end?: number;
}

/**
 * Parameters for adding an annotation.
 */
export interface AddAnnotationParameters {
	/** The blockClientId to add the annotation to. */
	blockClientId: string;
	/** Identifier for the RichText instance the annotation applies to. */
	richTextIdentifier?: string | null;
	/** The range at which to apply this annotation. */
	range?: AnnotationRange | null;
	/** The way to apply this annotation. */
	selector?: AnnotationSelector;
	/** The source that added the annotation. */
	source?: string;
	/** The ID the annotation should have. Generates a UUID by default. */
	id?: string;
}

/**
 * Store state interface.
 */
export type AnnotationsState = Partial< Record< string, Annotation[] > >;

/**
 * Action types.
 */
export type AnnotationAction =
	| {
			type: 'ANNOTATION_ADD';
			id: string;
			blockClientId: string;
			richTextIdentifier: string | null;
			source: string;
			selector: AnnotationSelector;
			range?: AnnotationRange;
	  }
	| {
			type: 'ANNOTATION_REMOVE';
			annotationId: string;
	  }
	| {
			type: 'ANNOTATION_UPDATE_RANGE';
			annotationId: string;
			start: number;
			end: number;
	  }
	| {
			type: 'ANNOTATION_REMOVE_SOURCE';
			source: string;
	  };

/**
 * Format registration interface for annotations.
 */
export interface AnnotationFormat {
	name: string;
	title: string;
	tagName: string;
	className: string;
	attributes: {
		className: string;
		id: string;
	};
	interactive: boolean;
	object: boolean;
	edit: () => null;
	__experimentalGetPropsForEditableTreePreparation: (
		select: any,
		props: {
			richTextIdentifier: string;
			blockClientId: string;
		}
	) => {
		annotations: Annotation[];
	};
	__experimentalCreatePrepareEditableTree: ( props: {
		annotations: Annotation[];
	} ) => ( formats: any[], text: string ) => any[];
	__experimentalGetPropsForEditableTreeChangeHandler: ( dispatch: any ) => {
		removeAnnotation: ( annotationId: string ) => void;
		updateAnnotationRange: (
			annotationId: string,
			start: number,
			end: number
		) => void;
	};
	__experimentalCreateOnChangeEditableValue: ( props: {
		removeAnnotation: ( annotationId: string ) => void;
		updateAnnotationRange: (
			annotationId: string,
			start: number,
			end: number
		) => void;
		annotations: Annotation[];
	} ) => ( formats: any[] ) => void;
}
