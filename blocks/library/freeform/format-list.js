/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Dashicon } from 'components';

/**
 * Internal dependencies
 */
import './format-list.scss';

class FormatList extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.switchFormat = this.switchFormat.bind( this );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			open: false,
		};
	}

	handleClickOutside() {
		if ( ! this.state.open ) {
			return;
		}
		this.setState( { open: false } );
	}

	toggleMenu() {
		this.setState( {
			open: ! this.state.open,
		} );
	}

	switchFormat( newValue ) {
		if ( this.props.value !== newValue && this.props.onFormatChange ) {
			this.props.onFormatChange( newValue );
		}
		this.setState( { open: false } );
	}

	render() {
		const { formats = [ { text: '', value: '', textStyle: () => '' } ] } = this.props;
		const selectedValue = this.props.value;
		return (
			<div className="editor-format-list">
				<Button
					className="editor-format-list__toggle"
					onClick={ this.toggleMenu }
					aria-haspopup="true"
					aria-expanded={ this.state.open }
					aria-label={ wp.i18n.__( 'Change format' ) }
				>
					<div className="formats">
						{ formats.map( ( { text, value } ) => (
							<span
								key={ value }
								className={ value === selectedValue ? 'active' : null }
								aria-hidden={ value !== selectedValue }
							>
								{ text }<br />
							</span>
						) ) }
					</div>
					<Dashicon icon="arrow-down" />
				</Button>
				{ this.state.open &&
					<div
						className="editor-format-list__menu"
						role="menu"
						tabIndex="0"
						aria-label={ wp.i18n.__( 'Formats' ) }
					>
						{ formats.map( ( { text, value } ) => (
							<Button
								key={ value }
								onClick={ () => this.switchFormat( value ) }
								className={ classnames( 'editor-format-list__menu-item', {
									'is-active': value === selectedValue,
								} ) }
								role="menuitem"
							>
								{ text }
							</Button>
						) ) }
					</div>
				}
			</div>
		);
	}
}

export default clickOutside( FormatList );
