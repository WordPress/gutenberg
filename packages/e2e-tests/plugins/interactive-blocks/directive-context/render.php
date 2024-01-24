<?php
/**
 * HTML for testing the directive `data-wp-context`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-context-view' );
?>

<div data-wp-interactive='{"namespace": "directive-context"}'>
	<div
		data-wp-context='{ "prop1":"parent","prop2":"parent","obj":{"prop4":"parent","prop5":"parent"},"array":[1,2,3] }'
	>
		<pre
			data-testid="parent context"
			data-wp-bind--children="state.renderContext"
		>
			<!-- rendered during hydration -->
		</pre>
		<button
			data-testid="parent prop1"
			name="prop1"
			value="modifiedFromParent"
			data-wp-on--click="actions.updateContext"
		>
			prop1
		</button>
		<button
			data-testid="parent prop2"
			name="prop2"
			value="modifiedFromParent"
			data-wp-on--click="actions.updateContext"
		>
			prop2
		</button>
		<button
			data-testid="parent obj.prop4"
			name="obj.prop4"
			value="modifiedFromParent"
			data-wp-on--click="actions.updateContext"
		>
			obj.prop4
		</button>
		<button
			data-testid="parent obj.prop5"
			name="obj.prop5"
			value="modifiedFromParent"
			data-wp-on--click="actions.updateContext"
		>
			obj.prop5
		</button>
		<div
			data-wp-context='{ "prop2":"child","prop3":"child","obj":{"prop5":"child","prop6":"child"},"array":[4,5,6] }'
		>
			<pre
				data-testid="child context"
				data-wp-bind--children="state.renderContext"
			>
				<!-- rendered during hydration -->
			</pre>
			<button
				data-testid="child prop1"
				name="prop1"
				value="modifiedFromChild"
				data-wp-on--click="actions.updateContext"
			>
				prop1
			</button>
			<button
				data-testid="child prop2"
				name="prop2"
				value="modifiedFromChild"
				data-wp-on--click="actions.updateContext"
			>
				prop2
			</button>
			<button
				data-testid="child prop3"
				name="prop3"
				value="modifiedFromChild"
				data-wp-on--click="actions.updateContext"
			>
				prop3
			</button>
			<button
				data-testid="child obj.prop4"
				name="obj.prop4"
				value="modifiedFromChild"
				data-wp-on--click="actions.updateContext"
			>
				obj.prop4
			</button>
			<button
				data-testid="child obj.prop5"
				name="obj.prop5"
				value="modifiedFromChild"
				data-wp-on--click="actions.updateContext"
			>
				obj.prop5
			</button>
			<button
				data-testid="child obj.prop6"
				name="obj.prop6"
				value="modifiedFromChild"
				data-wp-on--click="actions.updateContext"
			>
				obj.prop6
			</button>
		</div>
		<br />

		<button
			data-testid="context & other directives"
			data-wp-context='{ "text": "Text 1" }'
			data-wp-text="context.text"
			data-wp-on--click="actions.toggleContextText"
			data-wp-bind--value="context.text"
		>
			Toggle Context Text
		</button>
	</div>
</div>

<div
	data-wp-interactive='{"namespace": "directive-context-navigate"}'
	data-wp-router-region="navigation"
	data-wp-context='{ "text": "first page" }'
>
	<div data-testid="navigation text" data-wp-text="context.text"></div>
	<div data-testid="navigation new text" data-wp-text="context.newText"></div>
	<button data-testid="toggle text" data-wp-on--click="actions.toggleText">Toggle Text</button>
	<button data-testid="add new text" data-wp-on--click="actions.addNewText">Add New Text</button>
	<button data-testid="navigate" data-wp-on--click="actions.navigate">Navigate</button>
	<button data-testid="async navigate" data-wp-on--click="actions.asyncNavigate">Async Navigate</button>
</div>
