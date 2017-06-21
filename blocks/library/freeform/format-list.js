/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import classnames from 'classnames';
import { camelCase, fromPairs, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Button, Dashicon } from 'components';

/**
 * Internal dependencies
 */
import { __ } from 'i18n';
import './format-list.scss';

export function naiveCss2Jsx( styleText ) {
	return fromPairs(
		styleText.split( ';' ).filter( ( text ) => /\S/.test( text ) ).map(
			( stylePart ) => {
				const [ cssKey, cssValue ] = stylePart.split( ':', 2 );
				return [ camelCase( cssKey ), cssValue ];
			}
		)
	);
}

class FormatList extends Component {
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
		this.setState( ( state ) => ( {
			open: ! state.open,
		} ) );
	}

	switchFormat( newValue ) {
		if ( this.props.onFormatChange ) {
			this.props.onFormatChange( newValue );
		}
		this.setState( { open: false } );
	}

	render() {
		const { formats } = this.props;
		const selectedValue = this.props.value;
		const noFormat = { text: __( 'No format' ), value: null };
		const styleExclude = [ 'color', 'backgroundColor' ];
		return (
			formats && <div className="editor-format-list">
				<Button
					className="editor-format-list__toggle"
					onClick={ this.toggleMenu }
					aria-haspopup="true"
					aria-expanded={ this.state.open }
					aria-label={ __( 'Change format' ) }
				>
					<div className="formats">
						{ [ noFormat, ...formats ].map( ( { text, value }, i ) => (
							<span
								key={ i }
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
						aria-label={ __( 'Formats' ) }
					>
						{ formats.map( ( { text, value, textStyle } ) => (
							<Button
								key={ value }
								onClick={ () => this.switchFormat( value ) }
								className={ classnames( 'editor-format-list__menu-item', {
									'is-active': value === selectedValue,
								} ) }
								role="menuitem"
							>
								<span style={ omit( naiveCss2Jsx( textStyle() ), styleExclude ) }>{ text }</span>
							</Button>
						) ) }
					</div>
				}
			</div>
		);
	}
}

export default clickOutside( FormatList );
