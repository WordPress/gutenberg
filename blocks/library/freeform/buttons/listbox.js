/**
 * External dependencies
 */
import classnames from 'classnames';
import { find, isObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Button, TinymceIcon, Popover } from 'components';

class ListBoxButton extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isActive: false,
			isDisabled: false,
			value: '',
			opened: false,
		};
		this.mounted = true;
		this.toggleList = this.toggleList.bind( this );
		this.onSelect = this.onSelect.bind( this );
	}

	componentDidMount() {
		const { button } = this.props;
		const fnNames = [ 'onPostRender', 'onpostrender', 'OnPostRender' ];
		const onPostRender = find( fnNames, ( fn ) => button.hasOwnProperty( fn ) );
		if ( onPostRender ) {
			button[ onPostRender ].call( {
				active: ( isActive ) => this.mounted && this.setState( { isActive } ),
				disabled: ( isDisabled ) => this.mounted && this.setState( { isDisabled } ),
				value: ( value ) => this.mounted && this.setState( { value } ),
				text: () => {},
			} );
		}
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	onSelect( value ) {
		return ( event ) => {
			event.stopPropagation();
			this.setState( { value, opened: false } );
			const control = {
				value: () => value,
				settings: {
					value,
				},
			};
			if ( this.props.button.onselect ) {
				this.props.button.onselect.call( control, { control } );
			} else if ( this.props.button.onclick ) {
				this.props.button.onclick.call( control, { control } );
			}
		};
	}

	toggleList( event ) {
		event.stopPropagation();
		this.setState( ( state ) => ( {
			opened: ! state.opened,
		} ) );
	}

	render() {
		const { button } = this.props;
		const { isActive, isDisabled, value, opened } = this.state;
		const selectedChoice = find( button.values, ( choice ) => choice.value === value );
		let text = value;
		if ( selectedChoice && isObject( selectedChoice.text ) ) {
			text = selectedChoice.text.raw;
		} else if ( selectedChoice ) {
			text = selectedChoice.text;
		}

		if ( ! value && ! selectedChoice ) {
			return null;
		}

		return [
			<Button
				key="button"
				label={ button.text }
				onClick={ this.toggleList }
				className={ classnames( 'components-toolbar__control', {
					'is-active': isActive,
				} ) }
				aria-pressed={ isActive }
				disabled={ isDisabled }
			>
				{ button.icon && <TinymceIcon icon={ button.icon } /> }
				{ text }
			</Button>,
			opened && (
				<Popover position="bottom center" key="menu">
					{ button.values.map( ( choice, index ) => {
						const buttonText = isObject( choice.text ) ? choice.text.raw : choice.text;
						return (
							<button className="blocks-buttons__listbox-choice" key={ index } onClick={ this.onSelect( choice.value, buttonText ) }>
								{ buttonText }
							</button>
						);
					} ) }
				</Popover>
			),
		];
	}
}

export default ListBoxButton;
