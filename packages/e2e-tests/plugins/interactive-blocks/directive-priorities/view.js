( ( { wp } ) => {
	/**
	 * WordPress dependencies
	 */
	const {
		store,
		directive,
		deepSignal,
		useContext,
		useEffect,
		createElement: h
	} = wp.interactivity;

	/**
	 * Util to check that render calls happen in order.
	 *
	 * @param {string} n Name passed from the directive being executed.
	 */
	const executionProof = ( n ) => {
		const el = document.querySelector( '[data-testid="execution order"]' );
		if ( ! el.textContent ) el.textContent = n;
		else el.textContent += `, ${ n }`;
	};

	/**
	 * Simple context directive, just for testing purposes. It provides a deep
	 * signal with these two properties:
	 * - attribute: 'from context'
	 * - text: 'from context'
	 */
	directive(
		'test-context',
		( { context: { Provider }, props: { children } } ) => {
			executionProof( 'context' );
			const value = deepSignal( {
				attribute: 'from context',
				text: 'from context',
			} );
			return h( Provider, { value }, children );
		},
		{ priority: 8 }
	);

	/**
	 * Simple attribute directive, for testing purposes. It reads the value of
	 * `attribute` from context and populates `data-attribute` with it.
	 */
	directive( 'test-attribute', ( { context, evaluate, element } ) => {
		executionProof( 'attribute' );
		const contextValue = useContext( context );
		const attributeValue = evaluate( 'context.attribute', {
			context: contextValue,
		} );
		useEffect( () => {
			element.ref.current.setAttribute(
				'data-attribute',
				attributeValue,
			);
		}, [] );
		element.props[ 'data-attribute' ] = attributeValue;
	} );

	/**
	 * Simple text directive, for testing purposes. It reads the value of
	 * `text` from context and populates `children` with it.
	 */
	directive(
		'test-text',
		( { context, evaluate, element } ) => {
			executionProof( 'text' );
			const contextValue = useContext( context );
			const textValue = evaluate( 'context.text', {
				context: contextValue,
			} );
			element.props.children =
				h( 'p', { 'data-testid': 'text' }, textValue );
		},
		{ priority: 12 }
	);

	/**
	 * Children directive, for testing purposes. It adds a wrapper around
	 * `children`, including two buttons to modify `text` and `attribute` values
	 * from the received context.
	 */
	directive(
		'test-children',
		( { context, evaluate, element } ) => {
			executionProof( 'children' );
			const contextValue = useContext( context );
			const updateAttribute = () => {
				evaluate(
					'actions.updateAttribute',
					{ context: contextValue }
				);
			};
			const updateText = () => {
				evaluate( 'actions.updateText', { context: contextValue } );
			};
			element.props.children = h(
				'div',
				{},
				element.props.children,
				h( 'button', { onClick: updateAttribute }, 'Update attribute' ),
				h( 'button', { onClick: updateText }, 'Update text' )
			);
		},
		{ priority: 14 }
	);

	store( {
		actions: {
			updateText( { context } ) {
				context.text = 'updated';
			},
			updateAttribute( { context } ) {
				context.attribute = 'updated';
			},
		},
	} );
} )( window );
