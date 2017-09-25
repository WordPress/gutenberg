/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Toolbar, withSpokenMessages } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInputButton from '../../url-input/button';

const { ESCAPE } = keycodes;

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		format: 'italic',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		format: 'strikethrough',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.onUrlChange = this.onUrlChange.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			if ( this.state.isEditingLink ) {
				event.stopPropagation();
				this.dropLink();
			}
		}
	}

	toggleFormat( format ) {
		return () => {
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ],
			} );
		};
	}

	onUrlChange( { url, opensInNewWindow } ) {
		if ( !! url ) {
			this.props.onChange( { link: { value: url, target: opensInNewWindow ? '_blank' : '' } } );

			if ( ! this.props.format.link ) {
				this.props.speak( __( 'Link inserted.' ), 'assertive' );
			}
		} else {
			this.props.onChange( { link: undefined } );
		}
	}

	render() {
		const { formats, enabledControls = DEFAULT_CONTROLS, extraButtons, selectedNodeId } = this.props;
		const toolbarControls = FORMATTING_CONTROLS
			.filter( control => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => ( {
				...control,
				onClick: this.toggleFormat( control.format ),
				isActive: !! formats[ control.format ],
			} ) );

		const showLinkControl = enabledControls.indexOf( 'link' ) !== -1;

		return (
			<div ref={ this.bindRootNode } className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls }>
					{showLinkControl &&
						<UrlInputButton
							selectedNodeId={ selectedNodeId }
							onChange={ this.onUrlChange }
							url={ formats.link ? formats.link.value : '' } />
					}
					{ extraButtons }
				</Toolbar>

			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
