/**
 * External dependencies
 */
import { cond, matchesProperty } from 'lodash';

/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';
import { Component, createRef, Fragment } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { KeyboardShortcuts } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal Dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';

class BlockToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.container = createRef();

		this.focusContainer = this.focusContainer.bind( this );
		this.restoreFocus = this.restoreFocus.bind( this );
		this.resetActiveElementBeforeFocus = this.resetActiveElementBeforeFocus.bind( this );
		this.switchOnKeyDown = cond( [
			[ matchesProperty( [ 'keyCode' ], ESCAPE ), this.restoreFocus ],
		] );
	}

	componentDidMount() {
		if ( this.props.blockClientIds.length > 1 ) {
			this.focusContainer();
		}
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.blockClientIds.length <= 1 &&
			this.props.blockClientIds.length > 1
		) {
			this.focusContainer();
		}
	}

	/**
	 * Shifts focus to the first tabbable element within the toolbar container,
	 * if one exists.
	 */
	focusContainer() {
		const tabbables = focus.tabbable.find( this.container.current );
		if ( ! tabbables.length ) {
			return;
		}

		// Track the original active element prior to shifting focus, so that
		// focus can be returned if the user presses Escape while in toolbar.
		this.activeElementBeforeFocus = document.activeElement;

		tabbables[ 0 ].focus();
	}

	/**
	 * Restores focus to the active element at the time focus was
	 * programattically shifted to the toolbar, if one exists.
	 */
	restoreFocus() {
		if ( this.activeElementBeforeFocus ) {
			this.activeElementBeforeFocus.focus();
			this.resetActiveElementBeforeFocus();
		}
	}

	/**
	 * Clears the assigned active element which would be otherwise used in
	 * restoreFocus.
	 */
	resetActiveElementBeforeFocus() {
		delete this.activeElementBeforeFocus;
	}

	render() {
		const { blockClientIds, isValid, mode } = this.props;

		if ( ! blockClientIds.length ) {
			return null;
		}

		let controls;
		if ( blockClientIds.length > 1 ) {
			controls = <MultiBlocksSwitcher />;
		} else if ( mode === 'visual' && isValid ) {
			controls = (
				<Fragment>
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</Fragment>
			);
		}

		// Disable reason: The div is not intended to be interactable, but it
		// observes bubbled keypresses from its interactable children to infer
		// blur intent.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				ref={ this.container }
				onKeyDown={ this.switchOnKeyDown }
				onBlur={ this.resetActiveElementBeforeFocus }
				className="editor-block-toolbar"
			>
				<KeyboardShortcuts
					bindGlobal
					// Use the same event that TinyMCE uses in the Classic
					// block for its own `alt+f10` shortcut.
					eventName="keydown"
					shortcuts={ {
						'alt+f10': this.focusContainer,
					} }
				/>
				{ controls }
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
		/* eslint-disable jsx-a11y/no-static-element-interactions */
	}
}

export default withSelect( ( select ) => {
	const {
		getSelectedBlock,
		getBlockMode,
		getMultiSelectedBlockClientIds,
	} = select( 'core/editor' );
	const block = getSelectedBlock();
	const blockClientIds = block ?
		[ block.clientId ] :
		getMultiSelectedBlockClientIds();

	return {
		blockClientIds,
		isValid: block ? block.isValid : null,
		mode: block ? getBlockMode( block.clientId ) : null,
	};
} )( BlockToolbar );
