<?php
/**
 * HTML for testing the directive `data-wp-input`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-input">
	<!-- 1. Basic text input binding -->
	<div>
		<p data-wp-text="state.text" data-testid="text-output">hello</p>
		<input
			type="text"
			data-testid="text-input"
			data-wp-input="state.text"
			value="hello"
		/>
	</div>

	<!-- 2. Checkbox (auto-detect) -->
	<div>
		<p data-wp-text="state.checkedVal" data-testid="checkbox-output">false</p>
		<input
			type="checkbox"
			data-testid="checkbox-input"
			data-wp-input="state.checkedVal"
		/>
	</div>

	<!-- 3. Number input (type preservation) -->
	<div>
		<p data-wp-text="state.num" data-testid="number-output">0</p>
		<input
			type="number"
			data-testid="number-input"
			data-wp-input="state.num"
			value="0"
		/>
	</div>

	<!-- 4. Single select -->
	<div>
		<p data-wp-text="state.pet" data-testid="select-output">dog</p>
		<select
			data-testid="select-input"
			data-wp-input="state.pet"
		>
			<option value="dog">Dog</option>
			<option value="cat">Cat</option>
		</select>
	</div>

	<!-- 4b. Single select (no default) -->
	<div>
		<p data-wp-text="state.selectNone" data-testid="select-none-output"></p>
		<select
			data-testid="select-none-input"
			data-wp-input="state.selectNone"
		>
			<option value="x">X</option>
			<option value="y">Y</option>
		</select>
	</div>

	<!-- 5. Radio group -->
	<div>
		<p data-wp-text="state.petRadio" data-testid="radio-output">dog</p>
		<label>
			<input
				type="radio"
				data-testid="radio-dog"
				data-wp-input="state.petRadio"
				value="dog"
				checked
			/>
			Dog
		</label>
		<label>
			<input
				type="radio"
				data-testid="radio-cat"
				data-wp-input="state.petRadio"
				value="cat"
			/>
			Cat
		</label>
	</div>

	<!-- 5b. Radio group (no default) -->
	<div>
		<p data-wp-text="state.radioNone" data-testid="radio-none-output"></p>
		<label>
			<input
				type="radio"
				data-testid="radio-none-x"
				data-wp-input="state.radioNone"
				value="x"
			/>
			X
		</label>
		<label>
			<input
				type="radio"
				data-testid="radio-none-y"
				data-wp-input="state.radioNone"
				value="y"
			/>
			Y
		</label>
	</div>

	<!-- 6. Range input -->
	<div>
		<p data-wp-text="state.rangeVal" data-testid="range-output">50</p>
		<input
			type="range"
			data-testid="range-input"
			data-wp-input="state.rangeVal"
			value="50"
		/>
	</div>

	<!-- 7. Textarea -->
	<div>
		<p data-wp-text="state.textareaVal" data-testid="textarea-output">default</p>
		<textarea
			data-testid="textarea-input"
			data-wp-input="state.textareaVal"
		>default</textarea>
	</div>

	<!-- 8. Multiple select -->
	<div>
		<p data-wp-text="state.multiPet" data-testid="multiselect-output">dog</p>
		<select
			multiple
			data-testid="multiselect-input"
			data-wp-input="state.multiPet"
		>
			<option value="dog" selected>Dog</option>
			<option value="cat">Cat</option>
			<option value="bird">Bird</option>
		</select>
	</div>

	<!-- 9. Checkbox group (top-level properties) -->
	<div>
		<p data-wp-text="state.tags0" data-testid="checkbox-group-output-a">a</p>
		<p data-wp-text="state.tags1" data-testid="checkbox-group-output-b"></p>
		<label>
			<input
				type="checkbox"
				data-testid="checkbox-group-a"
				data-wp-input="state.tags0"
				value="a"
				checked
			/>
			A
		</label>
		<label>
			<input
				type="checkbox"
				data-testid="checkbox-group-b"
				data-wp-input="state.tags1"
				value="b"
			/>
			B
		</label>
	</div>

	<!-- 10. Toggle buttons (signal→element re-render verification) -->
	<div>
		<button
			data-testid="toggle-text"
			data-wp-on--click="actions.toggleText"
		>
			Toggle text
		</button>
		<button
			data-testid="toggle-checked"
			data-wp-on--click="actions.toggleChecked"
		>
			Toggle checked
		</button>
		<button
			data-testid="toggle-num"
			data-wp-on--click="actions.toggleNum"
		>
			Toggle num
		</button>
		<button
			data-testid="toggle-pet"
			data-wp-on--click="actions.togglePet"
		>
			Toggle pet
		</button>
		<button
			data-testid="toggle-multipet"
			data-wp-on--click="actions.toggleMultiPet"
		>
			Toggle multiPet
		</button>
	</div>

	<!-- 11. Element→signal seeding (state.seededVal NOT defined in view.js) -->
	<div>
		<p data-wp-text="state.seededVal" data-testid="seed-output"></p>
		<input
			type="text"
			data-testid="seed-input"
			data-wp-input="state.seededVal"
			value="seeded-from-html"
		/>
	</div>
</div>
