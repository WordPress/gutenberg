<?php
/**
 * HTML for testing the directive `data-wp-each`.
 *
 * @package gutenberg-test-interactive-blocks
 */

gutenberg_enqueue_module( 'directive-each-view' );
?>

<div
	data-wp-interactive='{ "namespace": "directive-each" }'
	data-wp-navigation-id="some-id"
>
	<div data-testid="default item name and key">
		<template data-wp-each="state.letters">
			<p data-wp-text="context.item" data-testid="item"></p>
		</template>
	</div>

	<div data-testid="fruits">
		<button
			data-testid="rotate" data-wp-on--click="actions.rotateFruits"
		>Rotate</button>
		<button
			data-testid="add" data-wp-on--click="actions.addFruit"
		>Add</button>
		<button
			data-testid="replace" data-wp-on--click="actions.replaceFruit"
		>Replace</button>
		<template data-wp-each--fruit="state.fruits">
			<p
				data-testid="item"
				data-wp-text="context.fruit"
				data-wp-on--click="actions.removeFruit"
			></p>
		</template>
	</div>

	<div data-testid="books">
		<button
			data-testid="rotate" data-wp-on--click="actions.rotateBooks"
		>Rotate</button>
		<button
			data-testid="add" data-wp-on--click="actions.addBook"
		>Add</button>
		<button
			data-testid="replace" data-wp-on--click="actions.replaceBook"
		>Replace</button>
		<button
			data-testid="modify" data-wp-on--click="actions.modifyBook"
		>Modify</button>
		<template
			data-wp-each--book="state.books"
			data-wp-each-key="context.book.isbn"
		>
			<p
				data-testid="item"
				data-wp-text="context.book.title"
				data-wp-on--click="actions.removeBook"
				data-wp-init="callbacks.generateRandomId"
			></p>
		</template>
	</div>
</div>
