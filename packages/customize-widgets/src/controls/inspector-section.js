export default function getInspectorSection() {
	const {
		wp: { customize },
	} = window;

	return class InspectorSection extends customize.Section {
		constructor( id, options ) {
			super( id, options );

			this.parentSection = options.parentSection;

			this.returnFocusWhenClose = null;
			this.isOpen = false;
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
			this.setIsOpen( true );
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
		collapse( opt ) {
			this.setIsOpen( false );
			super.collapse( opt );
		}
		setIsOpen( value ) {
			this.isOpen = value;
			this.triggerActiveCallbacks();
		}
		triggerActiveCallbacks() {
			this.active.callbacks.fireWith( this.active, [ false, true ] );
		}
	};
}
