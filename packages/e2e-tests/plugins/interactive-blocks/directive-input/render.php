<?php
/**
 * HTML for testing the directive `data-wp-input`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-input">
	<!-- Basic text input binding -->
	<div>
		<p data-wp-text="state.text" data-testid="text-output">hello</p>
		<input
			type="text"
			data-testid="text-input"
			data-wp-input="state.text"
			value="hello"
		/>
	</div>

	<!-- Checkbox (auto-detect) -->
	<div>
		<p data-wp-text="state.checkedVal" data-testid="checkbox-output">false</p>
		<input
			type="checkbox"
			data-testid="checkbox-input"
			data-wp-input="state.checkedVal"
		/>
	</div>

	<!-- Number input (type preservation) -->
	<div>
		<p data-wp-text="state.num" data-testid="number-output">0</p>
		<input
			type="number"
			data-testid="number-input"
			data-wp-input="state.num"
			value="0"
		/>
	</div>

	<!-- Select element -->
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
</div>
