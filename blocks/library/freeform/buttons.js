/**
 * External dependencies
 */
import { isFunction, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import SimpleButton from './buttons/simple';
import ListBoxButton from './buttons/listbox';
import MenuButton from './buttons/menu';
import SplitButton from './buttons/split';

class Buttons extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			buttons: [],
		};
	}

	componentDidMount() {
		if ( this.props.editor ) {
			this.updateButtons();
		}
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.editor !== this.props.editor ||
			prevProps.exclude !== this.props.exclude ||
			prevProps.buttons !== this.props.buttons
		) {
			this.updateButtons();
		}
	}

	updateButtons() {
		const { editor, buttons = [], exclude = [] } = this.props;
		const editorButtons = buttons
			.filter( ( id ) => exclude.indexOf( id ) === -1 && !! editor.buttons[ id ] )
			.map( ( id ) => {
				let button = editor.buttons[ id ];

				// Editor Buttons can be declared as functions
				if ( isFunction( button ) ) {
					button = button();
				}

				return { id, button };
			} );
		this.setState( { buttons: compact( editorButtons ) } );
	}

	render() {
		const { editor } = this.props;
		const { buttons } = this.state;

		if ( ! buttons.length ) {
			return null;
		}

		return (
			<ul className="components-toolbar">
				{ buttons.map( ( { id, button } ) => (
					<li key={ id }>
						{ ! button.type && <SimpleButton id={ id } button={ button } editor={ editor } /> }
						{ button.type === 'listbox' && <ListBoxButton id={ id } button={ button } editor={ editor } /> }
						{ button.type === 'menubutton' && <MenuButton id={ id } button={ button } editor={ editor } /> }
						{ button.type === 'splitbutton' && <SplitButton id={ id } button={ button } editor={ editor } /> }
					</li>
				) ) }
			</ul>
		);
	}
}

export default Buttons;
