/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { withInstanceId } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { authorAutocompleter } from '../../../../editor/components/autocompleters';
import RichText from '../../../../editor/components/rich-text';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';
import './style.scss';
const PANEL_NAME = 'author-panel';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );
		this.onSelect = this.onSelect.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.state = {
			theAuthor: false,
		};
		const { postAuthor, instanceId } = this.props;
		wp.apiRequest( { path: '/wp/v2/users/' + postAuthor + '?context=edit' } )
			.then( ( response ) => {
			console.log( 'two', response );
				this.setState( { theAuthor: response } );
			} );
	}

	// When an author is selected, set the post author.
	onSelect( value ) {
		if ( ! value ) {
			return;
		}
		console.log( 'setAuthorId', value )
		const { onUpdateAuthor } = this.props;
		onUpdateAuthor( Number( value.id ) );
	}

	onFocus( editor ) {
		if ( ! editor.dom ) {
			return;
		}
		const range = editor.dom.createRng();
		range.selectNodeContents(editor.getBody());
		editor.selection.setRng(range);
	}


	render() {
		const { postAuthor, instanceId, authors, isOpened, onTogglePanel } = this.props;
		const selectId = 'post-author-selector-' + instanceId;
		const theAuthor = this.state.theAuthor;
		console.log( 'render', theAuthor ? theAuthor.name : '' );


		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PostAuthorCheck>
				<PanelBody title={ __( 'Author' ) } opened={ isOpened } onToggle={ onTogglePanel }>
					<PanelRow>
						<div className="components-form-token-field">
							<div className="components-form-token-field__input-container">
								<RichText
									tagName="p"
									className="editor-post-author__select wp-block-paragraph"
									value={ theAuthor ? theAuthor.name : '' }
									aria-autocomplete="list"
									onSelect={ this.onSelect }
									onChange={ () => {} }
									autocompleters={ [ authorAutocompleter ] }
									onFocus={ this.onFocus }
								/>
							</div>
						</div>
					</PanelRow>
				</PanelBody>
			</PostAuthorCheck>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthor: select( 'core/editor' ).getEditedPostAttribute( 'author' ),
			authors: select( 'core' ).getAuthors(),
			isOpened: select( 'core/edit-post' ).isEditorSidebarPanelOpened( PANEL_NAME ),

		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
		onTogglePanel() {
			return dispatch( 'core/edit-post' ).toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	} ) ),
	withInstanceId,
] )( PostAuthor );
