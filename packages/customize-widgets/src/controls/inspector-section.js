export default function getInspectorSection() {
	const {
		wp: { customize },
	} = window;

	return class InspectorSection extends customize.Section {
		constructor( id, options ) {
			super( id, options );

			this.parentSection = options.parentSection;

			this.returnFocusWhenClose = null;
			this._isOpen = false;
		}
		get isOpen() {
			return this._isOpen;
		}
		set isOpen( value ) {
			this._isOpen = value;
			this.triggerActiveCallbacks();
		}
		ready() {
			this.contentContainer[ 0 ].classList.add(
				'customize-widgets-layout__inspector'
			);
		}
		isContextuallyActive() {
			return this.isOpen;
		}
		onChangeExpanded( expanded, args ) {
			super.onChangeExpanded( expanded, args );

			if ( this.parentSection && ! args.unchanged ) {
				if ( expanded ) {
					this.parentSection.collapse( {
						manualTransition: true,
					} );
				} else {
					this.parentSection.expand( {
						manualTransition: true,
						completeCallback: () => {
							// Return focus after finishing the transition.
							if (
								this.returnFocusWhenClose &&
								! this.contentContainer[ 0 ].contains(
									this.returnFocusWhenClose
								)
							) {
								this.returnFocusWhenClose.focus();
							}
						},
					} );
				}
			}
		}
		open( { returnFocusWhenClose } = {} ) {
			this.isOpen = true;
			this.returnFocusWhenClose = returnFocusWhenClose;

			this.expand( {
				allowMultiple: true,
			} );
		}
		close() {
			this.collapse( {
				allowMultiple: true,
			} );
		}
		collapse( options ) {
			// Overridden collapse() function. Mostly call the parent collapse(), but also
			// move our .isOpen to false.
			// Initially, I tried tracking this with onChangeExpanded(), but it doesn't work
			// because the block settings sidebar is a layer "on top of" the G editor sidebar.
			//
			// For example, when closing the block settings sidebar, the G
			// editor sidebar would display, and onChangeExpanded in
			// inspector-section would run with expanded=true, but I want
			// isOpen to be false when the block settings is closed.
			this.isOpen = false;
			super.collapse( options );
		}
		triggerActiveCallbacks() {
			// Manually fire the callbacks associated with moving this.active
			// from false to true.  "active" is always true for this section,
			// and "isContextuallyActive" reflects if the block settings
			// sidebar is currently visible, that is, it has replaced the main
			// Gutenberg view.
			// The WP customizer only checks ".isContextuallyActive()" when
			// ".active" changes values. But our ".active" never changes value.
			// The WP customizer never foresaw a section being used a way we
			// fit the block settings sidebar into a section. By manually
			// triggering the "this.active" callbacks, we force the WP
			// customizer to query our .isContextuallyActive() function and
			// update its view of our status.
			this.active.callbacks.fireWith( this.active, [ false, true ] );
		}
	};
}
