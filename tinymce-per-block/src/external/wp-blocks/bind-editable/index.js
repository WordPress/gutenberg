/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import isEqualShallow from 'is-equal-shallow';
import tinymce from 'tinymce';

// TODO: Shouldn't be able to access this from external
import { parse } from 'parsers/block';

function initialize( node, onSetup ) {
	if ( ! node ) {
		return;
	}

	tinymce.init( {
		target: node.querySelector( '[contenteditable=true]' ),
		theme: 'inlite',
		inline: true,
		skin_url: '//s1.wp.com/wp-includes/js/tinymce/skins/lightgray',
		entity_encoding: 'raw',
		setup: onSetup
	} );
}

export default function bindEditable( BaseComponent ) {
	class EditableComponent extends Component {
		static defaultProps = {
			setContent() {}
		};

		componentDidMount() {
			initialize( this.node, this.onSetup );
		}

		componentDidUpdate( prevProps ) {
			if ( ! isEqualShallow( this.props, prevProps ) ) {
				initialize( this.node, this.onChange );
			}
		}

		componentWillUnmount() {
			if ( this.editor ) {
				this.editor.destroy();
			}
		}

		onSetup = ( editor ) => {
			this.editor = editor;

			editor.on( 'init', this.setInitialContent );
			editor.on( 'change focusout undo redo', this.onChange );
		};

		setInitialContent = () => {
			this.content = this.editor.getContent();
		};

		onChange = () => {
			// TODO: `getContent` is slow, but formats better than 'raw'. We
			// should check implication of performance and see if we can rely
			// on raw formatting instead.

			const content = this.editor.getContent();
			if ( content === this.content ) {
				return;
			}

			this.props.setChildren( parse( content ) );
			this.content = content;
		};

		setRef = ( node ) => {
			this.node = node;
		};

		render() {
			return (
				<div ref={ this.setRef }>
					<BaseComponent { ...this.props } />
				</div>
			);
		}
	}

	return ( node, state ) => <EditableComponent { ...{ node, ...state } } />;
}
