# **core/annotations**: Annotations

## Selectors

### __experimentalGetAnnotationsForBlock

Returns the annotations for a specific client ID.

*Parameters*

 * state: Editor state.
 * clientId: The ID of the block to get the annotations for.

### __experimentalGetAnnotationsForRichText

Returns the annotations that apply to the given RichText instance.

Both a blockClientId and a richTextIdentifier are required. This is because
a block might have multiple `RichText` components. This does mean that every
block needs to implement annotations itself.

*Parameters*

 * state: Editor state.
 * blockClientId: The client ID for the block.
 * richTextIdentifier: Unique identifier that identifies the given RichText.

*Returns*

All the annotations relevant for the `RichText`.

### __experimentalGetAnnotations

Returns all annotations in the editor state.

*Parameters*

 * state: Editor state.

*Returns*

All annotations currently applied.

## Actions

### __experimentalAddAnnotation

Adds an annotation to a block.

The `block` attribute refers to a block ID that needs to be annotated.
`isBlockAnnotation` controls whether or not the annotation is a block
annotation. The `source` is the source of the annotation, this will be used
to identity groups of annotations.

The `range` property is only relevant if the selector is 'range'.

*Parameters*

 * annotation: The annotation to add.
 * blockClientId: The blockClientId to add the annotation to.
 * richTextIdentifier: Identifier for the RichText instance the annotation applies to.
 * range: The range at which to apply this annotation.
 * range.start: The offset where the annotation should start.
 * range.end: The offset where the annotation should end.
 * string: [selector="range"] The way to apply this annotation.
 * string: [source="default"] The source that added the annotation.
 * string: [id=uuid()]        The ID the annotation should have.
                                   Generates a UUID by default.

### __experimentalRemoveAnnotation

Removes an annotation with a specific ID.

*Parameters*

 * annotationId: The annotation to remove.

### __experimentalUpdateAnnotationRange

Updates the range of an annotation.

*Parameters*

 * annotationId: ID of the annotation to update.
 * start: The start of the new range.
 * end: The end of the new range.

### __experimentalRemoveAnnotationsBySource

Removes all annotations of a specific source.

*Parameters*

 * source: The source to remove.