/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { diffAriaProps } from './aria';

export default class Editable extends Component {
	constructor() {
		super();
		this.bindEditorNode = this.bindEditorNode.bind( this );
	}

	// We must prevent rerenders because the browser will modify the DOM. React
	// will rerender the DOM fine, but we're losing selection and it would be
	// more expensive to do so as it would just set the inner HTML through
	// `dangerouslySetInnerHTML`. Instead RichText does it's own diffing and
	// selection setting.
	//
	// Because we never update the component, we have to look through props and
	// update the attributes on the wrapper nodes here. `componentDidUpdate`
	// will never be called.
	shouldComponentUpdate( nextProps ) {
		if ( ! isEqual( this.props.style, nextProps.style ) ) {
			this.editorNode.setAttribute( 'style', '' );
			Object.assign( this.editorNode.style, {
				...( nextProps.style || {} ),
				whiteSpace: 'pre-wrap',
			} );
		}

		if ( ! isEqual( this.props.className, nextProps.className ) ) {
			this.editorNode.className = nextProps.className;
		}

		if ( this.props.start !== nextProps.start ) {
			this.editorNode.setAttribute( 'start', nextProps.start );
		}

		if ( this.props.reversed !== nextProps.reversed ) {
			this.editorNode.reversed = nextProps.reversed;
		}

		const { removedKeys, updatedKeys } = diffAriaProps( this.props, nextProps );
		removedKeys.forEach( ( key ) =>
			this.editorNode.removeAttribute( key ) );
		updatedKeys.forEach( ( key ) =>
			this.editorNode.setAttribute( key, nextProps[ key ] ) );

		return false;
	}

	bindEditorNode( editorNode ) {
		this.editorNode = editorNode;
		this.props.setRef( editorNode );
	}

	render() {
		const {
			tagName = 'div',
			style = {},
			record,
			valueToEditableHTML,
			className,
			...remainingProps
		} = this.props;

		delete remainingProps.setRef;

		// In HTML, leading and trailing spaces are not visible, and multiple
		// spaces elsewhere are visually reduced to one space. This rule
		// prevents spaces from collapsing so all space is visible in the editor
		// and can be removed.
		// It also prevents some browsers from inserting non-breaking spaces at
		// the end of a line to prevent the space from visually disappearing.
		// Sometimes these non breaking spaces can linger in the editor causing
		// unwanted non breaking spaces in between words. If also prevent
		// Firefox from inserting a trailing `br` node to visualise any trailing
		// space, causing the element to be saved.
		//
		// > Authors are encouraged to set the 'white-space' property on editing
		// > hosts and on markup that was originally created through these
		// > editing mechanisms to the value 'pre-wrap'. Default HTML whitespace
		// > handling is not well suited to WYSIWYG editing, and line wrapping
		// > will not work correctly in some corner cases if 'white-space' is
		// > left at its default value.
		// >
		// > https://html.spec.whatwg.org/multipage/interaction.html#best-practices-for-in-page-editors
		const whiteSpace = 'pre-wrap';

		return createElement( tagName, {
			role: 'textbox',
			'aria-multiline': true,
			className,
			contentEditable: true,
			ref: this.bindEditorNode,
			style: {
				...style,
				whiteSpace,
			},
			suppressContentEditableWarning: true,
			dangerouslySetInnerHTML: { __html: valueToEditableHTML( record ) },
			...remainingProps,
		} );
	}
}
