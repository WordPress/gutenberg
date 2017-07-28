/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { NoticeList } from 'components';
import { Provider as EditorProvider } from 'editor';
import { parse, serialize } from 'blocks';
import { Component } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';
import Sidebar from '../sidebar';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import UnsavedChangesWarning from '../unsaved-changes-warning';
import DocumentTitle from '../document-title';
import { removeNotice, editPost } from '../actions';
import {
	getEditorMode,
	isEditorSidebarOpened,
	getNotices,
	getEditedPostContent,
} from '../selectors';

class Layout extends Component {
	constructor() {
		super( ...arguments );
		this.onChangeBlocks = this.onChangeBlocks.bind( this );
		this.onChangeHtml = this.onChangeHtml.bind( this );
		this.state = {
			blocks: [],
			html: '',
		};
	}

	onChangeBlocks( blocks ) {
		const html = serialize( blocks, this.props.config.blockTypes );
		this.setState( {
			blocks,
			html,
		} );
		this.props.editPost( { content: html } );
	}

	onChangeHtml( html ) {
		const { blockTypes, fallbackBlockType } = this.props.config;
		const blocks = parse( html, blockTypes, fallbackBlockType );
		console.log( html, blocks );
		this.setState( {
			blocks,
			html,
		} );
		this.props.editPost( { content: html } );
	}

	componentDidMount() {
		const { blockTypes, fallbackBlockType } = this.props.config;
		this.setState( {
			html: this.props.value,
			blocks: parse( this.props.value, blockTypes, fallbackBlockType ),
		} );
	}

	render() {
		const { config, mode, isSidebarOpened, notices, ...props } = this.props;
		const className = classnames( 'editor-layout', {
			'is-sidebar-opened': isSidebarOpened,
		} );
		const { blocks, html } = this.state;

		return (
			<EditorProvider config={ config } value={ blocks } onChange={ this.onChangeBlocks }>
				<div className={ className }>
					<DocumentTitle />
					<NoticeList onRemove={ props.removeNotice } notices={ notices } />
					<UnsavedChangesWarning />
					<Header />
					<div className="editor-layout__content">
						{ mode === 'text' && <TextEditor value={ html } onChange={ this.onChangeHtml } /> }
						{ mode === 'visual' && <VisualEditor /> }
					</div>
					{ isSidebarOpened && <Sidebar /> }
				</div>
			</EditorProvider>
		);
	}
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
		notices: getNotices( state ),
		value: getEditedPostContent( state ),
	} ),
	{ removeNotice, editPost }
)( Layout );
