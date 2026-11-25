---
reviewer: [ramonjd, andrewserong]
---

Does this change how the media editor looks or behaves for the people who use it? The media editor is the interface for viewing and editing a single media item, including the image editing canvas for cropping, rotating, flipping and zooming. Its code is in `@wordpress/media-editor`, `@wordpress/image-editor`, the deprecated `@wordpress/image-cropper`, and the `routes/media-editor` route. Answer no when what people see and do stays the same, such as for a dependency update, a type change or a test change that keeps the same runtime behavior. Answer no for the media modal and for media blocks such as Image, Gallery or Cover.
