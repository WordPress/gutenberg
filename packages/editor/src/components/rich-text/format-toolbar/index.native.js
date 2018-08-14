/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {	
	IconButton,	
	Toolbar,
} from '@wordpress/components';
import { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER, displayShortcut } from '@wordpress/keycodes';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
//import PositionedAtSelection from './positioned-at-selection';
//import URLInput from '../../url-input';
import { filterURLForDisplay } from '../../../utils/url';

import { Text } from 'react-native'

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		shortcut: displayShortcut.primary( 'b' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		shortcut: displayShortcut.primary( 'i' ),
		format: 'italic',
	},
	{
		icon: 'admin-links',
		title: __( 'Link' ),
		shortcut: displayShortcut.primary( 'k' ),
		format: 'link',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		shortcut: displayShortcut.access( 'd' ),
		format: 'strikethrough',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

// Stop the key event from propagating up to maybeStartTyping in BlockListBlock
const stopKeyPropagation = ( event ) => event.stopPropagation();

/**
 * Returns the Format Toolbar state given a set of props.
 *
 * @param {Object} props Component props.
 *
 * @return {Object} State object.
 */
function computeDerivedState( props ) {
	return {
		selectedNodeId: props.selectedNodeId,
		settingsVisible: false,
		opensInNewWindow: !! props.formats.link && !! props.formats.link.target,
		linkValue: '',
	};
}

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {};

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			const link = this.props.formats.link;
			const isAddingLink = link && link.isAdding;
			if ( isAddingLink ) {
				event.stopPropagation();
				if ( ! link.value ) {
					this.dropLink();
				} else {
					this.props.onChange( { link: { ...link, isAdding: false } } );
				}
			}
		}
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			stopKeyPropagation( event );
		}
	}

	static getDerivedStateFromProps( props, state ) {
		if ( state.selectedNodeId !== props.selectedNodeId ) {
			return computeDerivedState( props );
		}

		return null;
	}

	onChangeLinkValue( value ) {
		this.setState( { linkValue: value } );
	}

	toggleFormat( format ) {
		return () => {
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ],
			} );
		};
	}

	toggleLinkSettingsVisibility() {
		this.setState( ( state ) => ( { settingsVisible: ! state.settingsVisible } ) );
	}

	setLinkTarget( opensInNewWindow ) {
		this.setState( { opensInNewWindow } );
		if ( this.props.formats.link && ! this.props.formats.link.isAdding ) {
			this.props.onChange( { link: {
				value: this.props.formats.link.value,
				target: opensInNewWindow ? '_blank' : null,
				rel: opensInNewWindow ? 'noreferrer noopener' : null,
			} } );
		}
	}

	addLink() {
		this.setState( { linkValue: '' } );
		this.props.onChange( { link: { isAdding: true } } );
	}

	dropLink() {
		this.props.onChange( { link: null } );
		this.setState( { linkValue: '' } );
	}

	editLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { ...this.props.formats.link, isAdding: true } } );
		this.setState( { linkValue: this.props.formats.link.value } );
	}

	submitLink( event ) {
		event.preventDefault();
		const value = prependHTTP( this.state.linkValue );
		this.props.onChange( { link: {
			isAdding: false,
			target: this.state.opensInNewWindow ? '_blank' : null,
			rel: this.state.opensInNewWindow ? 'noreferrer noopener' : null,
			value,
		} } );

		this.setState( { linkValue: value } );
		if ( ! this.props.formats.link.value ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}
	}

	isFormatActive( format ) {
		return this.props.formats[ format ] && this.props.formats[ format ].isActive;
	}

	render() {
		const { formats, enabledControls = DEFAULT_CONTROLS, customControls = [], selectedNodeId } = this.props;
		const { linkValue, settingsVisible, opensInNewWindow } = this.state;
		const isAddingLink = formats.link && formats.link.isAdding;

		const toolbarControls = FORMATTING_CONTROLS.concat( customControls )
			.filter( ( control ) => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => {
				// if ( control.format === 'link' ) {
				// 	const isFormatActive = this.isFormatActive( 'link' );
				// 	const isActive = isFormatActive || isAddingLink;
				// 	return {
				// 		...control,
				// 		icon: isFormatActive ? 'editor-unlink' : 'admin-links', // TODO: Need proper unlink icon
				// 		title: isFormatActive ? __( 'Unlink' ) : __( 'Link' ),
				// 		onClick: isActive ? this.dropLink : this.addLink,
				// 		isActive,
				// 	};
				// }

				return {
					...control,
					onClick: this.toggleFormat( control.format ),
					isActive: this.isFormatActive( control.format ),
				};
			} );		

		return (			
			<Toolbar controls={ toolbarControls } />			
		);
	}
}

export default FormatToolbar;
