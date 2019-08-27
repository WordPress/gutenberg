# Disallow the usage of BaseControl component with a label prop set but omitting the id property (no-base-control-with-label-without-id)

Base control component ideally should be used together with components providing user input. The label the BaseControl component receives, should be associated with some component providing user via an id attribute.
If a label is provided but the id is omitted it means that the developer missed the id prop or that BaseControl is not a good fit for the use case and a div together with a span can provide the same functionality.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
	<BaseControl
		label="ok"
	>
		<input id="my-id" />
	</BaseControl>
```


```jsx
	<BaseControl label="ok" />
```

Examples of **correct** code for this rule:


```jsx
	<BaseControl />
```

```jsx
	<BaseControl
		id="my-id"
	>
		<input id="my-id" />
	</BaseControl>
```

```jsx
	<BaseControl
		label="ok"
		id="my-id"
	>
		<input id="my-id" />
	</BaseControl>
```
