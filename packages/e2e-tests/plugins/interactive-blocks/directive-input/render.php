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

		<div data-wp-context='{ "ctxText": "ctx-hello" }'>
			<p data-wp-text="context.ctxText" data-testid="ctx-text-output">ctx-hello</p>
			<input
				type="text"
				data-testid="ctx-text-input"
				data-wp-input="context.ctxText"
				value="ctx-hello"
			/>
			<button
				data-testid="toggle-ctx-text"
				data-wp-on--click="actions.toggleCtxText"
			>
				Toggle ctx text
			</button>
		</div>
	</div>

	<!-- 2. Checkbox (auto-detect) -->
	<div>
		<p data-wp-text="state.checkedVal" data-testid="checkbox-output">false</p>
		<input
			type="checkbox"
			data-testid="checkbox-input"
			data-wp-input="state.checkedVal"
		/>

		<div data-wp-context='{ "ctxChecked": false }'>
			<p data-wp-text="context.ctxChecked" data-testid="ctx-checkbox-output">false</p>
			<input
				type="checkbox"
				data-testid="ctx-checkbox-input"
				data-wp-input="context.ctxChecked"
			/>
			<button
				data-testid="toggle-ctx-checked"
				data-wp-on--click="actions.toggleCtxChecked"
			>
				Toggle ctx checked
			</button>
		</div>
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

		<div data-wp-context='{ "ctxNum": 0 }'>
			<p data-wp-text="context.ctxNum" data-testid="ctx-number-output">0</p>
			<input
				type="number"
				data-testid="ctx-number-input"
				data-wp-input="context.ctxNum"
				value="0"
			/>
			<button
				data-testid="toggle-ctx-num"
				data-wp-on--click="actions.toggleCtxNum"
			>
				Toggle ctx num
			</button>
		</div>
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

		<div data-wp-context='{ "ctxPet": "dog" }'>
			<p data-wp-text="context.ctxPet" data-testid="ctx-select-output">dog</p>
			<select
				data-testid="ctx-select-input"
				data-wp-input="context.ctxPet"
			>
				<option value="dog">Dog</option>
				<option value="cat">Cat</option>
			</select>
			<button
				data-testid="toggle-ctx-pet"
				data-wp-on--click="actions.toggleCtxPet"
			>
				Toggle ctx pet
			</button>
		</div>
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

		<div data-wp-context='{ "ctxRadioPet": "dog" }'>
			<p data-wp-text="context.ctxRadioPet" data-testid="ctx-radio-output">dog</p>
			<label>
				<input
					type="radio"
					data-testid="ctx-radio-dog"
					data-wp-input="context.ctxRadioPet"
					value="dog"
					checked
				/>
				Dog
			</label>
			<label>
				<input
					type="radio"
					data-testid="ctx-radio-cat"
					data-wp-input="context.ctxRadioPet"
					value="cat"
				/>
				Cat
			</label>
		</div>
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

		<div data-wp-context='{ "ctxRangeVal": 50 }'>
			<p data-wp-text="context.ctxRangeVal" data-testid="ctx-range-output">50</p>
			<input
				type="range"
				data-testid="ctx-range-input"
				data-wp-input="context.ctxRangeVal"
				value="50"
			/>
		</div>
	</div>

	<!-- 7. Textarea -->
	<div>
		<p data-wp-text="state.textareaVal" data-testid="textarea-output">default</p>
		<textarea
			data-testid="textarea-input"
			data-wp-input="state.textareaVal"
		>default</textarea>

		<div data-wp-context='{ "ctxTextareaVal": "default" }'>
			<p data-wp-text="context.ctxTextareaVal" data-testid="ctx-textarea-output">default</p>
			<textarea
				data-testid="ctx-textarea-input"
				data-wp-input="context.ctxTextareaVal"
			>default</textarea>
		</div>
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

		<div data-wp-context='{ "ctxMultiPet": ["dog"] }'>
			<p data-wp-text="context.ctxMultiPet" data-testid="ctx-multiselect-output">dog</p>
			<select
				multiple
				data-testid="ctx-multiselect-input"
				data-wp-input="context.ctxMultiPet"
			>
				<option value="dog" selected>Dog</option>
				<option value="cat">Cat</option>
				<option value="bird">Bird</option>
			</select>
			<button
				data-testid="toggle-ctx-multipet"
				data-wp-on--click="actions.toggleCtxMultiPet"
			>
				Toggle ctx multiPet
			</button>
		</div>
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

	<!-- 15. File input -->
	<div>
		<p data-wp-text="state.fileName" data-testid="file-name-output"></p>
		<input
			type="file"
			data-testid="file-input"
			data-wp-input="state.fileData"
		/>

		<div data-wp-context='{ "ctxFileData": [] }'>
			<p data-wp-text="context.ctxFileData.0.name" data-testid="ctx-file-name-output"></p>
			<input
				type="file"
				data-testid="ctx-file-input"
				data-wp-input="context.ctxFileData"
			/>
		</div>
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
