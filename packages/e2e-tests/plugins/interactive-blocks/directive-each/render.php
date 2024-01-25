<?php
/**
 * HTML for testing the directive `data-wp-each`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-each-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-each" }'>
	<div data-testid="letters">
		<template data-wp-each="state.letters">
			<p data-wp-text="context.item" data-testid="item"></p>
		</template>
		<!-- SSRed elements; they should be removed on hydration -->
		<p data-testid="item" data-wp-each-child>A</p>
		<p data-testid="item" data-wp-each-child>B</p>
		<p data-testid="item" data-wp-each-child>C</p>
	</div>

	<hr>

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
		<!-- SSRed elements; they should be removed on hydration -->
		<p data-testid="item" data-wp-each-child>avocado</p>
		<p data-testid="item" data-wp-each-child>banana</p>
		<p data-testid="item" data-wp-each-child>cherimoya</p>
	</div>

	<hr>

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
			></p>
		</template>
		<!-- SSRed elements; they should be removed on hydration -->
		<p data-testid="item" data-wp-each-child>A Game of Thrones</p>
		<p data-testid="item" data-wp-each-child>A Clash of Kings</p>
		<p data-testid="item" data-wp-each-child>A Storm of Swords</p>
	</div>

	<hr>

	<div data-testid="numbers">
		<button
			data-testid="shift" data-wp-on--click="actions.shiftNumber"
		>Shift</button>
		<button
			data-testid="unshift" data-wp-on--click="actions.unshiftNumber"
		>Unshift</button>
		<template data-wp-each="state.numbers">
			<p data-wp-text="context.item" data-testid="item"></p>
		</template>
		<p data-testid="item" data-wp-each-child>1</p>
		<p data-testid="item" data-wp-each-child>2</p>
		<p data-testid="item" data-wp-each-child>3</p>
		<p data-testid="item">4</p>
	</div>

	<hr>

	<div data-testid="empty">
		<button
			data-testid="add" data-wp-on--click="actions.addItem"
		>Add</button>
		<template data-wp-each="state.emptyList">
			<p data-wp-text="context.item" data-testid="item"></p>
		</template>
		<p data-testid="item">item X</p>
	</div>

	<div data-testid="siblings">
		<button
			data-testid="unshift"
			data-wp-on--click="actions.unshiftNumberAndName"
		>Unshift</button>
		<template
			data-wp-each="state.numbersAndNames"
			data-wp-each-key="context.item.value"
		>
			<p data-wp-text="context.item.name" data-testid="item"></p>
			<p data-wp-text="context.item.value" data-testid="item"></p>
		</template>
		<p data-testid="item" data-wp-each-child>two</p>
		<p data-testid="item" data-wp-each-child>2</p>
		<p data-testid="item" data-wp-each-child>three</p>
		<p data-testid="item" data-wp-each-child>3</p>
		<p data-testid="item">four</p>
		<p data-testid="item">4</p>
	</div>

	<div data-testid="nested">
		<button
			data-testid="add animal"
			data-wp-on--click="actions.addAnimal"
		>Add animal</button>
		<button
			data-testid="add breeds"
			data-wp-on--click="actions.addBreeds"
		>Add breeds</button>

		<ul>
			<template
				data-wp-each--animal="state.animalBreeds"
				data-wp-each-key="context.animal.name"
			>
				<li data-testid="animal">
					<span
						data-testid="name"
						data-wp-text="context.animal.name"
					></span>
					<ul>
						<template data-wp-each--breed="context.animal.breeds">
							<li data-wp-text="context.breed"></li>
						</template>
					</ul>
				</li>
			</template>
			<!-- SSRed elements; they should be removed on hydration -->
			<li data-testid="animal" data-wp-each-child>
				<span data-testid="name">Dog</span>
				<ul>
					<template data-wp-each--breed="context.animal.breeds">
						<li data-wp-text="context.breed"></li>
					</template>
					<li data-wp-each-child>Chihuahua</li>
					<li data-wp-each-child>Rottweiler</li>
				</ul>
			</li>
			<li data-testid="animal" data-wp-each-child>
				<span data-testid="name">Cat</span>
				<ul>
					<template data-wp-each--breed="context.animal.breeds">
						<li data-wp-text="context.breed"></li>
					</template>
					<li data-wp-each-child>Sphynx</li>
					<li data-wp-each-child>Siamese</li>
				</ul>
			</li>
		</ul>
	</div>

	<div data-testid="invalid tag">
		<div data-wp-each="state.letters">
			<p data-wp-text="context.item" data-testid="item"></p>
		</div>
	</div>


	<div data-testid="derived state">
		<button
			data-testid="rotate" data-wp-on--click="actions.rotateFruits"
		>Rotate</button>
		<template
			data-wp-context='{ "idPrefix": "fruit-" }'
			data-wp-each--fruit="state.fruits"
			data-wp-each-key="state.fruitId"
		>
			<p
				data-testid="item"
				data-wp-text="context.fruit"
				data-wp-bind--data-fruit-id="state.fruitId"
			></p>
		</template>
		<!-- SSRed elements; they should be removed on hydration -->
		<p data-testid="item" data-wp-each-child>avocado</p>
		<p data-testid="item" data-wp-each-child>banana</p>
		<p data-testid="item" data-wp-each-child>cherimoya</p>
	</div>
</div>

<hr>

<div
	data-wp-interactive='{ "namespace": "directive-each" }'
	data-wp-router-region="navigation-updated list"
	data-wp-context='{ "list": [ "beta", "gamma", "delta" ] }'
	data-testid="navigation-updated list"
>
	<button
		data-testid="navigate"
		data-wp-on--click="actions.navigate"
	>Navigate</button>
	<template data-wp-each="context.list">
		<p data-wp-text="context.item" data-testid="item"></p>
	</template>
	<p data-testid="item" data-wp-each-child>beta</p>
	<p data-testid="item" data-wp-each-child>gamma</p>
	<p data-testid="item" data-wp-each-child>delta</p>
</div>
