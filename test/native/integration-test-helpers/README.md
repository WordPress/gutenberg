# Integration test helpers

The following helper functions can be used within integration tests to simplify and make more readable the test cases.

### [`addBlock`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/add-block.js)

Adds a block via the block picker.

### [`advanceAnimationByTime`, `advanceAnimationByFrames` ](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/advance-animation.js)

Advance Reanimated animations by time or frames.

### [`dismissModal`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/dismiss-block.js)

Dismisses a modal.

### [`getBlock`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/get-block.js)

Gets a block from the root block list.

### [`getBlockTransformOptions`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/get-block-transform-options.js)

Get the block transform options of a block.

### [`getEditorHtml`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/get-editor-html.js)

Gets the current HTML output of the editor.

### [`getInnerBlock`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/get-inner-block.js)

Gets an inner block from another block.

### [`initializeEditor`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/initialize-editor.js)

Initialize an editor for test assertions.

### [`openBlockActionsMenu`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/open-block-actions-menu.js)

Opens the block's actions menu of the current selected block.

### [`openBlockSettings`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/open-block-settings.js)

Opens the block settings of the current selected block.

### [`changeAndSelectTextOfRichText`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/rich-text-change-and-select-text.js)

Changes the text and selection of a RichText component.

### [`changeTextOfRichText`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/rich-text-change-text.js)

Changes the text of a RichText component.

### [`pasteIntoRichText`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/rich-text-paste.js)

Paste content into a RichText component.

### [`setupApiFetch`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/setup-api-fetch.js)

Sets up the `apiFetch` library for testing by mocking request responses.

### [`setupCoreBlocks`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/setup-core-blocks.js)

Registers all core blocks or a specific list of blocks before running tests, once the tests are run, all registered blocks are unregistered.

### [`setupMediaPicker`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/setup-media-picker.js)

Sets up Media Picker mock functions.

### [`setupMediaUpload`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/setup-media-upload.js)

Sets up the media upload mock functions for testing.

### [`setupPicker`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/setup-picker.js)

Sets up the Picker component for testing.

### [`changeTextOfTextInput`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/text-input-change-text.js)

Changes the text of a TextInput component.

### [`transformBlock`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/transform-block.js)

Transform the specified block to another block using the Block actions menu.

### [`triggerBlockListLayout`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/trigger-block-list-layout.js)

Helper for ensuring that all items of a Block List component are rendered.

### [`waitForModalVisible`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/wait-for-modal-visible.js)

Waits for a modal to be visible.

### [`waitForStoreResolvers`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/wait-for-store-resolvers.js)

Executes a function that triggers store resolvers and waits for them to be finished.

### [`withFakeTimers`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/with-fake-timers.js)

Set up fake timers for executing a function and restores them afterwards.

### [`withReanimatedTimer`](https://github.com/WordPress/gutenberg/blob/HEAD/test/native/integration-test-helpers/with-reanimated-timer.js)

Prepare timers for executing a function that uses the Reanimated APIs.