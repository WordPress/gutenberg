/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	useEffect,
	privateApis,
} from '@wordpress/interactivity';

const { directive, proxifyState, h } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/**
 * Namespace used in custom directives and store.
 */
const namespace = 'directive-priorities';

/**
 * Util to check that render calls happen in order.
 *
 * @param {string} n Name passed from the directive being executed.
 */
const executionProof = ( n ) => {
	const el = document.querySelector( '[data-testid="execution order"]' );
	if ( ! el.textContent ) {
		el.textContent = n;
	} else {
		el.textContent += `, ${ n }`;
	}
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
		const client = {
			[ namespace ]: proxifyState( namespace, {
				attribute: 'from context',
				text: 'from context',
			} ),
		};
		return h( Provider, { value: { client } }, children );
	},
	{ priority: 8 }
);

/**
 * Simple attribute directive, for testing purposes. It reads the value of
 * `attribute` from context and populates `data-attribute` with it.
 */
directive( 'test-attribute', ( { evaluate, element } ) => {
	executionProof( 'attribute' );
	const attributeValue = evaluate( {
		namespace,
		value: 'context.attribute',
	} );
	useEffect( () => {
		element.ref.current.setAttribute( 'data-attribute', attributeValue );
	}, [] );
	element.props[ 'data-attribute' ] = attributeValue;
} );

/**
 * Simple text directive, for testing purposes. It reads the value of
 * `text` from context and populates `children` with it.
 */
directive(
	'test-text',
	( { evaluate, element } ) => {
		executionProof( 'text' );
		const textValue = evaluate( { namespace, value: 'context.text' } );
		element.props.children = h( 'p', { 'data-testid': 'text' }, textValue );
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
	( { evaluate, element } ) => {
		executionProof( 'children' );
		const updateAttribute = () => {
			evaluate( { namespace, value: 'actions.updateAttribute' } );
		};
		const updateText = () => {
			evaluate( { namespace, value: 'actions.updateText' } );
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

store( 'directive-priorities', {
	actions: {
		updateText() {
			const context = getContext();
			context.text = 'updated';
		},
		updateAttribute() {
			const context = getContext();
			context.attribute = 'updated';
		},
	},
} );
