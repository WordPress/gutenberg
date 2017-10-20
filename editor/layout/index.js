/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NoticeList, Popover, KeyboardShortcuts } from '@wordpress/components';

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
import AutosaveMonitor from '../autosave-monitor';
import { removeNotice } from '../actions';
import MetaBoxes from '../meta-boxes';
import {
	getEditorMode,
	isEditorSidebarOpened,
	getNotices,
} from '../selectors';

class Layout extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.focusNextRegion = this.focusRegion.bind( this, 1 );
		this.focusPreviousRegion = this.focusRegion.bind( this, -1 );
		this.onClick = this.onClick.bind( this );
		this.state = {
			isFocusingRegions: false,
		};
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	focusRegion( offset ) {
		const regions = [ ...this.container.querySelectorAll( '[role="region"]' ) ];
		if ( ! regions.length ) {
			return;
		}
		let nextRegion = regions[ 0 ];
		const selectedIndex = regions.indexOf( document.activeElement );
		if ( selectedIndex !== -1 ) {
			let nextIndex = selectedIndex + offset;
			nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
			nextIndex = nextIndex === regions.length ? 0 : nextIndex;
			nextRegion = regions[ nextIndex ];
		}

		nextRegion.focus();
		this.setState( { isFocusingRegions: true } );
	}

	onClick() {
		this.setState( { isFocusingRegions: false } );
	}

	render() {
		const { mode, isSidebarOpened, notices, ...props } = this.props;
		const className = classnames( 'editor-layout', {
			'is-sidebar-opened': isSidebarOpened,
			'is-focusing-regions': this.state.isFocusingRegions,
		} );

		// Disable reason: Clicking the editor should dismiss the regions focus style
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div key="editor" className={ className } ref={ this.bindContainer } onClick={ this.onClick }>
				<DocumentTitle />
				<NoticeList onRemove={ props.removeNotice } notices={ notices } />
				<UnsavedChangesWarning />
				<AutosaveMonitor />
				<Header />
				<div className="editor-layout__content">
					<div className="editor-layout__editor">
						{ mode === 'text' && <TextEditor /> }
						{ mode === 'visual' && <VisualEditor /> }
					</div>
					<MetaBoxes location="normal" />
				</div>
				{ isSidebarOpened && <Sidebar /> }
				<Popover.Slot />
				<KeyboardShortcuts shortcuts={ {
					'ctrl+r': this.focusNextRegion,
					'ctrl+shift+r': this.focusPreviousRegion,
				} } />
			</div>
			/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		);
	}
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
		notices: getNotices( state ),
	} ),
	{ removeNotice }
)( Layout );
