<?php
/**
 * HTML for testing the directive `data-wp-interactive`.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div>
	<div data-wp-show-mock="state.falseValue">
		<span data-testid="not inside an island">
			This should be shown because it is inside an island.
		</span>
	</div>

	<div data-wp-interactive>
		<div data-wp-show-mock="state.falseValue">
			<span data-testid="inside an island">
				This should not be shown because it is inside an island.
			</span>
		</div>
	</div>

	<div data-wp-interactive>
		<div data-wp-ignore>
			<div data-wp-show-mock="state.falseValue">
				<span
					data-testid="inside an inner block of an isolated island"
				>
					This should be shown because it is inside an inner
					block of an isolated island.
				</span>
			</div>
		</div>
	</div>

	<div data-wp-interactive>
		<div data-wp-interactive>
			<div
				data-wp-show-mock="state.falseValue"
				data-testid="island inside another island"
			>
				<span>
					This should not have two template wrappers because
					that means we hydrated twice.
				</span>
			</div>
		</div>
	</div>

	<div data-wp-interactive>
		<div>
			<div data-wp-interactive data-wp-ignore>
				<div data-wp-show-mock="state.falseValue">
					<span
						data-testid="island inside inner block of isolated island"
					>
						This should not be shown because even though it
						is inside an inner block of an isolated island,
						it's inside an new island.
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
