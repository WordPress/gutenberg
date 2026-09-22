# Upload Media

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

This module is a media upload handler with a queue-like system that is implemented using a custom `@wordpress/data` store.

Such a system is useful for additional client-side processing of media files (e.g. image compression) before uploading them to a server.

It is typically used by `@wordpress/block-editor` but can also be leveraged outside of it.

## Installation

Install the module

```bash
npm install @wordpress/upload-media --save
```

## Usage

This is a basic example of how one can interact with the upload data store:

```js
import { store as uploadStore } from '@wordpress/upload-media';
import { dispatch } from '@wordpress/data';

dispatch( uploadStore ).updateSettings( /* ... */ );
dispatch( uploadStore ).addItems( [ /* ... */ ] );
```

Refer to the API reference below or the TypeScript types for further help.

## Upload operations

Every file the queue uploads goes through a pipeline of named steps, called operations: core prepares the file, converts or resizes it where the browser can, uploads it, generates thumbnails and finalizes the attachment. The steps live in a registry, and a plugin registers its own the same way core does.

```js
import { __ } from '@wordpress/i18n';
import { registerUploadOperation } from '@wordpress/upload-media';

registerUploadOperation( 'my-plugin/generate-subtitles', {
	label: __( 'Generating subtitles', 'my-plugin' ),

	// Decides whether, and where, this step runs for a new item. Called once
	// core has built the item's default pipeline.
	plan( item ) {
		if ( ! item.file.type.startsWith( 'video/' ) ) {
			return;
		}
		return { after: 'core/upload', args: { language: 'en' } };
	},

	// Runs when the step is reached. Resolves with updates for the item;
	// throws to cancel it.
	async handler( item, args, context ) {
		const vtt = await transcribe( item.file, args.language, {
			signal: context.signal,
		} );
		context.addSideloadItem( {
			file: vtt,
			additionalData: { image_size: 'subtitles' },
		} );
	},
} );
```

Names are namespaced like block names. Registering a name that is already registered is refused, so replacing a step, core's included, is an explicit `unregisterUploadOperation()` followed by `registerUploadOperation()` under the same name. An operation cannot be unregistered while an item in the queue still lists it.

### Planning

`plan( item, { operations, settings } )` runs for every registered operation when a new top-level item is added, in ascending `priority` (default 10; ties keep registration order), after core has decided the item's default pipeline. Each plan sees the pipeline as the plans before it left it. It returns one of:

- nothing, to leave the item alone;
- a placement, `{ before: name }`, `{ after: name }` or `{ at: 'start' | 'end' }`, with optional `args` for the handler. When the anchor is not in this item's pipeline the step is skipped, so `{ after: 'core/transcode-image' }` means "only when an image is transcoded";
- an array of steps, which replaces the pipeline wholesale. This is the escape hatch for removing or reordering steps for one item.

Once every plan has run, the pipeline is checked against the registry: an item whose pipeline names an operation that is not registered fails with an `UploadError` naming the step.

### Handlers

`handler( item, args, context )` runs when the item reaches the step. It receives:

- `item`: a snapshot of the item — `id`, `parentId`, `batchId`, `file`, `sourceFile`, `attachment`, `additionalData` and the other files earlier steps set aside. It is frozen; updates go through the return value.
- `args`: the arguments the plan placed the step with.
- `context.signal`: aborted when the item is cancelled.
- `context.settings`: the store settings, read-only.
- `context.updateProgress( progress )`: reports the step's progress, 0–100.
- `context.addOperations( operations )`: appends steps to this item's pipeline.
- `context.addSideloadItem( { file, additionalData, operations } )`: queues a companion file to be sideloaded to this item's attachment once it exists. The child is parented to the item and its `post` is filled in by the queue.

It resolves with updates to apply to the item — typically `file`, `attachment` or `additionalData`, which reaches the server as request fields — or with nothing. Throwing cancels the item; throw an `UploadError` to control the message the user sees, and set `silent: true` on it to cancel without one.

### Concurrency pools

A pool is a named limit on how many items may run the operations assigned to it at once. Core registers `upload` (limit: the `maxConcurrentUploads` setting), `image` (`maxConcurrentImageProcessing`) and `video` (1). An operation joins a pool through its `concurrency` setting, and a plugin declares its own with `registerUploadConcurrencyPool()`:

```js
import { registerUploadConcurrencyPool } from '@wordpress/upload-media';

registerUploadConcurrencyPool( 'my-plugin/transcription', { limit: 1 } );
```

A step without a pool runs unthrottled.

### Core operations

Core registers `core/prepare`, `core/detect-ultra-hdr`, `core/upload`, `core/resize-crop`, `core/rotate`, `core/transcode-image`, `core/transcode-gif`, `core/thumbnail-generation` and `core/finalize`. `UploadOperationType` holds these names as constants. Replacing one of them with `unregisterUploadOperation()` and `registerUploadOperation()` is supported; the replacement runs with the same context a plugin's operation gets, not with core's internal access to the store.

## API Reference

<!-- START TOKEN(Autogenerated API docs) -->

### clearFeatureDetectionCache

Clears the cached feature detection result.

This is primarily useful for testing purposes.

### detectClientSideMediaSupport

Detects whether the browser supports client-side media processing.

Checks (in order of evaluation): 1. WebAssembly support (required for wasm-vips). 2. SharedArrayBuffer support (required for WASM threading; relies on cross-origin isolation headers being set). 3. Web Worker support (baseline requirement for the processing worker). 4. Device memory: disables on devices reporting ≤ 2 GB of RAM. 5. Hardware concurrency: disables on devices reporting fewer than 2 CPU cores. 6. Network conditions: disables when the data saver flag is on, or when the connection's effective type is `slow-2g` or `2g`. 7. CSP compatibility for blob URL workers: a probe Worker is created from a blob: URL to confirm the site's Content Security Policy permits inline worker creation (`worker-src` must allow `blob:`).

Results are cached after the first call. Use `clearFeatureDetectionCache()` to reset.

_Returns_

- `FeatureDetectionResult`: Feature detection result with supported status and reason if not supported.

### ErrorCode

Undocumented declaration.

### ErrorMessageConfig

Undocumented declaration.

### FeatureDetectionResult

Undocumented declaration.

### getErrorMessage

Gets a user-friendly error message configuration for an error code.

_Parameters_

- _code_ `ErrorCode | string`: The error code from UploadError.
- _fileName_ `string`: The name of the file that failed to upload.

_Returns_

- `ErrorMessageConfig`: Error message configuration with title, description, and action.

### getHeicConversionAdvice

Returns advice on how to get a HEIC image uploaded on the current platform.

HEIC decoding depends on codecs provided by the operating system, so which browsers work varies by platform. The browser that just failed is left out of the suggestions, and every variant ends with the JPEG fallback, which works everywhere.

_Returns_

- `string`: A localized, browser- and platform-specific sentence.

### getHeicUnsupportedMessage

Builds the message shown when a HEIC image cannot be converted.

Explains why the conversion failed in terms of the current browser and operating system, then hands off to the advice for that combination.

_Returns_

- `string`: A localized, browser- and platform-specific error message.

### getUploadOperation

Returns a registered upload operation by name.

_Parameters_

- _name_ `OperationName`: Operation name.

_Returns_

- `OperationDefinition | undefined`: The operation, or undefined if none is registered under that name.

### getUploadOperations

Returns all registered upload operations, in registration order.

_Returns_

- `OperationDefinition[]`: The operations.

### ImageFormat

Undocumented declaration.

### isClientSideMediaSupported

Returns whether client-side media processing is supported.

This is a convenience function that returns just the boolean result.

_Returns_

- `boolean`: Whether client-side media processing is supported.

### isHeicCanvasSupported

Detects whether the browser can decode HEIC images via canvas APIs.

This checks for createImageBitmap and OffscreenCanvas support, which are sufficient to convert HEIC to JPEG without VIPS/WASM. Safari supports both APIs and can natively decode HEIC via createImageBitmap(), leveraging macOS platform codecs.

_Returns_

- `boolean`: Whether HEIC canvas-based processing is supported.

### MediaUploadProvider

Writes the given settings into the upload store.

The store is a single instance living in the default data registry, so operations registered against it are visible to every editor on the page.

_Parameters_

- _props_ `any`:
- _props.children_ `any`: Children.
- _props.settings_ `any`: Upload settings.

### registerUploadConcurrencyPool

Registers a concurrency pool for upload operations to join.

A pool is a named limit on how many items may run the operations assigned to it at the same time. It is declared once, here, and operations join it by name through their `concurrency` setting; an operation can only join a pool that is registered. The pools `upload`, `image` and `video` ship with the package.

_Usage_

```js
import {
	registerUploadConcurrencyPool,
	registerUploadOperation,
} from '@wordpress/upload-media';

registerUploadConcurrencyPool( 'my-plugin/ocr', { limit: 2 } );

registerUploadOperation( 'my-plugin/read-text', {
	label: __( 'Reading text', 'my-plugin' ),
	concurrency: 'my-plugin/ocr',
	// ...
} );
```

_Parameters_

- _name_ `string`: Pool name.
- _settings_ `UploadConcurrencyPoolSettings`: The pool's limit, either a finite positive number or a function of the store settings returning one.

_Returns_

- `ConcurrencyPoolDefinition | undefined`: The registered pool, or undefined if it was rejected.

### registerUploadOperation

Registers an operation the upload queue can run as a step of an item's pipeline.

Names are namespaced like block names. A name that is already registered is rejected, so replacing a step, core's included, is an explicit `unregisterUploadOperation()` followed by a `registerUploadOperation()` under the same name.

_Usage_

```js
import { registerUploadOperation } from '@wordpress/upload-media';

registerUploadOperation( 'my-plugin/generate-subtitles', {
	label: __( 'Generating subtitles', 'my-plugin' ),
	plan( item ) {
		if ( item.file.type.startsWith( 'video/' ) ) {
			return { after: 'core/upload', args: { language: 'en' } };
		}
	},
	async handler( item, args, context ) {
		const vtt = await transcribe( item.file, args.language, {
			signal: context.signal,
		} );
		context.addSideloadItem( {
			file: vtt,
			additionalData: { image_size: 'subtitles' },
		} );
	},
} );
```

_Parameters_

- _name_ `OperationName`: Namespaced operation name, e.g. `my-plugin/generate-subtitles`.
- _settings_ `UploadOperationSettings< Args >`: The operation: its label, handler, and optionally how it plans itself into an item's pipeline and which concurrency pool it counts against.

_Returns_

- `OperationDefinition | undefined`: The registered operation, or undefined if it was rejected.

### store

Store definition for the media upload namespace.

_Related_

- <https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore>

### unregisterUploadOperation

Unregisters an upload operation.

Refused while any item in the queue still lists the operation in its pipeline, so that no item is left holding a step it cannot finish.

_Parameters_

- _name_ `OperationName`: Operation name.

_Returns_

- `OperationDefinition | undefined`: The removed operation, or undefined if it was refused.

### UploadConcurrencyPool

Undocumented declaration.

### UploadConcurrencyPoolSettings

Undocumented declaration.

### UploadError

MediaError class.

Small wrapper around the `Error` class to hold an error code and a reference to a file object.

_Type_

- `UploadError`

### UploadOperation

Undocumented declaration.

### UploadOperationContext

Undocumented declaration.

### UploadOperationItem

Undocumented declaration.

### UploadOperationName

Undocumented declaration.

### UploadOperationPlacement

Undocumented declaration.

### UploadOperationPlanContext

Undocumented declaration.

### UploadOperationPlanResult

Undocumented declaration.

### UploadOperationResult

Undocumented declaration.

### UploadOperationSettings

Undocumented declaration.

### UploadOperationSideloadArgs

Undocumented declaration.

### UploadOperationStep

Undocumented declaration.

### UploadOperationType

Undocumented declaration.

<!-- END TOKEN(Autogenerated API docs) -->

### Actions

The following set of dispatching action creators are available on the object returned by `wp.data.dispatch( 'core/upload-media' )`:

<!-- START TOKEN(Autogenerated actions|src/store/actions.ts) -->

#### addItems

Adds a new item to the upload queue.

_Parameters_

- _$0_ `AddItemsArgs`:
- _$0.files_ `AddItemsArgs[ 'files' ]`: Files
- _$0.onChange_ `[AddItemsArgs[ 'onChange' ]]`: Function called each time a file or a temporary representation of the file is available.
- _$0.onSuccess_ `[AddItemsArgs[ 'onSuccess' ]]`: Function called after the file is uploaded.
- _$0.onBatchSuccess_ `[AddItemsArgs[ 'onBatchSuccess' ]]`: Function called after a batch of files is uploaded.
- _$0.onError_ `[AddItemsArgs[ 'onError' ]]`: Function called when an error happens.
- _$0.additionalData_ `[AddItemsArgs[ 'additionalData' ]]`: Additional data to include in the request.
- _$0.allowedTypes_ `[AddItemsArgs[ 'allowedTypes' ]]`: Array with the types of media that can be uploaded, if unset all types are allowed.

#### cancelItem

Cancels an item in the queue based on an error.

If the error is retryable and the item hasn't exceeded the maximum retry attempts, it will be scheduled for automatic retry instead of being cancelled.

_Parameters_

- _id_ `QueueItemId`: Item ID.
- _error_ `Error`: Error instance.
- _silent_ Whether to cancel the item silently, without invoking its `onError` callback.

#### executeRetry

Executes a scheduled retry for an item.

This is called by the timer set in scheduleRetry. It verifies the item is still in PendingRetry status before proceeding with the retry.

_Parameters_

- _id_ `QueueItemId`: Item ID.

#### retryItem

Retries a failed item in the queue.

_Parameters_

- _id_ `QueueItemId`: Item ID.

#### scheduleRetry

Schedules an automatic retry for a failed item.

Uses exponential backoff with jitter to determine the retry delay. The item will be placed in PendingRetry status and automatically retried after the calculated delay.

_Parameters_

- _id_ `QueueItemId`: Item ID.
- _error_ `Error`: The error that caused the failure.

<!-- END TOKEN(Autogenerated actions|src/store/actions.ts) -->

### Selectors

The following selectors are available on the object returned by `wp.data.select( 'core/upload-media' )`:

<!-- START TOKEN(Autogenerated selectors|src/store/selectors.ts) -->

#### getItems

Returns all items currently being uploaded.

_Parameters_

- _state_ `State`: Upload state.

_Returns_

- `QueueItem[]`: Queue items.

#### getSettings

Returns the media upload settings.

_Parameters_

- _state_ `State`: Upload state.

_Returns_

- `Settings`: Settings

#### isUploading

Determines whether any upload is currently in progress.

_Parameters_

- _state_ `State`: Upload state.

_Returns_

- `boolean`: Whether any upload is currently in progress.

#### isUploadingById

Determines whether an upload is currently in progress given an attachment ID.

_Parameters_

- _state_ `State`: Upload state.
- _attachmentId_ `number`: Attachment ID.

_Returns_

- `boolean`: Whether upload is currently in progress for the given attachment.

#### isUploadingByUrl

Determines whether an upload is currently in progress given an attachment URL.

_Parameters_

- _state_ `State`: Upload state.
- _url_ `string`: Attachment URL.

_Returns_

- `boolean`: Whether upload is currently in progress for the given attachment.

<!-- END TOKEN(Autogenerated selectors|src/store/selectors.ts) -->
