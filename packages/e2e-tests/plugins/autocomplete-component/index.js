( function () {
	const el = wp.element.createElement;
	const useRef = wp.element.useRef;
	const useState = wp.element.useState;
	const Autocomplete = wp.components.Autocomplete;
	const create = wp.richText.create;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginSidebar = wp.editor.PluginSidebar;

	const fruits = {
		name: 'fruit',
		triggerPrefix: '~',
		options: [
			{ visual: '🍎', name: 'Apple', id: 1 },
			{ visual: '🍊', name: 'Orange', id: 2 },
			{ visual: '🍇', name: 'Grapes', id: 3 },
		],
		getOptionLabel: ( option ) => `${ option.visual } ${ option.name }`,
		getOptionKeywords: ( option ) => [ option.name ],
		getOptionCompletion: ( option ) => option.visual,
	};

	function Field() {
		const ref = useRef();
		const [ record, setRecord ] = useState( () => create() );

		function readRecord() {
			const element = ref.current;
			const selection = element.ownerDocument.defaultView.getSelection();
			const range = selection.rangeCount
				? selection.getRangeAt( 0 )
				: null;
			setRecord( create( { element, range } ) );
		}

		// The field is plain text, so the value is one text node.
		function onChange( value ) {
			ref.current.textContent = value.text;
			ref.current.ownerDocument
				.getSelection()
				.collapse(
					ref.current.firstChild ?? ref.current,
					value.end ?? 0
				);
			setRecord( value );
		}

		return el(
			Autocomplete,
			{
				record,
				onChange,
				onReplace() {},
				completers: [ fruits ],
				contentRef: ref,
				isSelected: true,
			},
			( { onKeyDown, listBoxId, activeId } ) =>
				el( 'div', {
					ref,
					contentEditable: 'plaintext-only',
					suppressContentEditableWarning: true,
					role: 'textbox',
					'aria-label': 'Autocomplete field',
					'aria-multiline': true,
					'aria-autocomplete': 'list',
					'aria-controls': listBoxId,
					'aria-activedescendant': activeId,
					onKeyDown,
					onInput: readRecord,
					onKeyUp: readRecord,
					onClick: readRecord,
					style: {
						border: '1px solid #949494',
						minHeight: '40px',
						padding: '8px',
					},
				} )
		);
	}

	registerPlugin( 'autocomplete-component', {
		icon: 'text',
		render: () =>
			el(
				PluginSidebar,
				{
					name: 'autocomplete-component',
					title: 'Autocomplete component',
				},
				el( Field )
			),
	} );
} )();
