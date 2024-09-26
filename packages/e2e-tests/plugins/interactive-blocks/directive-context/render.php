<?php
/**
 * HTML for testing the directive `data-wp-context`.
 *
 * @package gutenberg-test-interactive-blocks
 */
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
		<button data-testid="parent replace" data-wp-on--click="actions.replaceObj">Replace obj</button>
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
		<button
			data-testid="parent new"
			name="new"
			value="modifiedFromParent"
			data-wp-on--click="actions.updateContext"
		>
			new
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
			<button data-testid="child replace" data-wp-on--click="actions.replaceObj">Replace obj</button>
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
			<button
				data-testid="child copy obj"
				data-wp-on--click="actions.copyObj"
			>
				Copy obj
			</button>
			<div>
				Is proxy preserved? <span
					data-testid="is proxy preserved"
					data-wp-text="state.isProxyPreserved"
				></span>
			</div>
			<div>
				Is proxy preserved on copy? <span
					data-testid="is proxy preserved on copy"
					data-wp-text="state.isProxyPreservedOnCopy"
				></span>
			</div>
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
	<div data-wp-context='{}'>
		<div data-testid="navigation inherited text" data-wp-text="context.text"></div>
		<div data-testid="navigation inherited text2" data-wp-text="context.text2"></div>
	</div>
	<div data-testid="navigation text" data-wp-text="context.text"></div>
	<div data-testid="navigation new text" data-wp-text="context.newText"></div>
	<button data-testid="toggle text" data-wp-on--click="actions.toggleText">Toggle Text</button>
	<button data-testid="add new text" data-wp-on--click="actions.addNewText">Add New Text</button>
	<button data-testid="add text2" data-wp-on--click="actions.addText2">Add Text 2</button>
	<button data-testid="navigate" data-wp-on--click="actions.navigate">Navigate</button>
	<button data-testid="async navigate" data-wp-on--click="actions.asyncNavigate">Async Navigate</button>
</div>

<div
	data-wp-interactive='{"namespace": "directive-context-non-default"}'
	data-wp-context--non-default='{ "text": "non default" }'
	data-wp-context='{ "defaultText": "default" }'
>
	<span data-testid="non-default suffix context" data-wp-text="context.text"></span>
	<span data-testid="default suffix context" data-wp-text="context.defaultText"></span>
</div>

<div
	data-wp-interactive='directive-context'
	data-wp-context='{ "list": [
		{ "id": 1, "text": "Text 1" },
		{ "id": 2, "text": "Text 2" }
	] }'
>
	<button data-testid="select 1" data-wp-on--click="actions.selectItem" value=1>Select 1</button>
	<button data-testid="select 2" data-wp-on--click="actions.selectItem" value=2>Select 2</button>
	<div data-testid="selected" data-wp-text="state.selected"></div>
</div>

<div
	data-wp-interactive="directive-context-watch"
	data-wp-context='{"counter":0}'
>
	<button
		data-testid="counter parent"
		data-wp-on--click="actions.increment"
		data-wp-text="context.counter"
	></button>
	<div
		data-wp-context='{"counter":0, "changes":0}'
		data-wp-watch="callbacks.countChanges"
	>
		<button
			data-testid="counter child"
			data-wp-on--click="actions.increment"
			data-wp-text="context.counter"
		>
		</button>
		<span
			data-testid="counter changes"
			data-wp-text="context.changes"
		></span>
	</div>
</div>


<div
	data-testid="inheritance from other namespaces"
	data-wp-interactive="directive-context/parent"
	data-wp-context='{ "prop": "fromParentNs" }'
>
	<div
		data-wp-interactive="directive-context/child"
		data-wp-context='{ "prop": "fromChildNs" }'
	>
		<span
			data-testid="parent"
			data-wp-text="directive-context/parent::context.prop"
		></span>
		<span
			data-testid="child"
			data-wp-text="directive-context/child::context.prop"
		></span>
	</div>
</div>
