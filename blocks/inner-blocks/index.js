/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { serialize } from '../api';

class InnerBlocks extends Component {
	constructor() {
		super( ...arguments );

		const store = wp.editor.createStore();
		store.dispatch( {
			type: 'RESET_BLOCKS',
			blocks: this.props.value,
		} );

		this.store = store;
		this.editor = store.getState().editor;

		this.maybeChange = this.maybeChange.bind( this );

		// For child store, monitor changes to emit back up to parent store
		store.subscribe( this.maybeChange );
	}

	shouldComponentUpdate() {
		// TODO: Investigate if we can avoid disabling render reconciliation.
		// Needed currently because render passes a new settings reference by
		// presence of types (via shallow clone). Maybe assign in constructor.
		return false;
	}

	maybeChange() {
		const state = this.store.getState();
		const { editor } = state;
		if ( editor === this.editor ) {
			return;
		}

		const blocks = wp.editor.selectors.getBlocks( state );
		this.props.onChange( blocks );
		this.editor = editor;
	}

	render() {
		const { types } = this.props;

		let { settings } = this.props;
		if ( types ) {
			settings = {
				...settings,
				blockTypes: types,
			};
		}

		// TODO: We should not be referencing editor on the global object, but
		// this is a circular dependency between editor and blocks.

		// TODO: The DIV wrapper inside EditorProvider should be eliminated,
		// and exists because provider supports only a single child.

		return (
			<wp.editor.EditorProvider settings={ settings } store={ this.store } >
				<div>
					<wp.editor.BlockList />
					<wp.editor.DefaultBlockAppender />
				</div>
			</wp.editor.EditorProvider>
		);
	}
}

InnerBlocks = withContext( 'editor' )()( InnerBlocks );

InnerBlocks.Content = ( { value } ) => {
	if ( ! value ) {
		return null;
	}

	const html = serialize( value );

	return <wp-raw-html dangerouslySetInnerHTML={ { __html: html } } />;
};

export default InnerBlocks;
