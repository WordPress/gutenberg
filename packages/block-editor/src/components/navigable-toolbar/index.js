/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { NavigableMenu, KeyboardShortcuts, ToolbarContainer } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import deprecated from '@wordpress/deprecated';

class NavigableToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.focusToolbar = this.focusToolbar.bind( this );

		this.toolbar = createRef();

		this.state = {
			hasNonAccessibleTabbable: false,
		};
	}

	focusToolbar() {
		const tabbables = focus.tabbable.find( this.toolbar.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			window.requestAnimationFrame( () => {
				this.focusToolbar();
			} );
		}

		// Toolbar items added via Portal (Slot bubblesVirtually) aren't added
		// to the DOM right away
		window.requestAnimationFrame( () => {
			if ( ! this.toolbar.current ) {
				return;
			}

			// If there are tabbable elements within this component that aren't
			// ToolbarButton, we'll fallback to the old NavigableToolbar and emit a
			// warning
			const hasNonAccessibleTabbable = focus.tabbable
				.find( this.toolbar.current )
				.some( ( el ) => ! el.hasAttribute( 'data-toolbar-button' ) );

			if ( hasNonAccessibleTabbable ) {
				this.setState( { hasNonAccessibleTabbable } );
			}
		} );
	}

	render() {
		const { children, accessibilityLabel, ...props } = this.props;
		const label = accessibilityLabel || props[ 'aria-label' ];

		const toolbarProps = {
			...omit( props, [ 'focusOnMount' ] ),
			ref: this.toolbar,
			children: (
				<>
					<KeyboardShortcuts
						bindGlobal
						// Use the same event that TinyMCE uses in the Classic block for its own `alt+f10` shortcut.
						eventName="keydown"
						shortcuts={ {
							'alt+f10': this.focusToolbar,
						} }
					/>
					{ children }
				</>
			),
		};

		if ( this.state.hasNonAccessibleTabbable ) {
			deprecated( 'Using tabbable controls without `ToolbarButton`', {
				alternative: '`ToolbarButton` for toolbar items',
			} );

			return (
				<NavigableMenu
					{ ...toolbarProps }
					orientation="horizontal"
					role="toolbar"
				/>
			);
		}

		return <ToolbarContainer { ...toolbarProps } accessibilityLabel={ label } />;
	}
}

export default NavigableToolbar;
