class ModeSwitcher extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.state = {
			opened: false
		};
	}

	toggle() {
		this.setState( {
			opened: ! this.state.opened
		} );
	}

	render() {
		const { opened } = this.state;
		const modes = [
			{ value: 'visual', label: 'Visual' },
			{ value: 'text', label: 'Text' },
		];
		const switchMode = ( mode ) => () => {
			this.setState( { opened: false } );
			this.props.onSwitch( mode );
		};
		const currentMode = modes.find( ( { value } ) => value === this.props.mode );

		return (
			<div className="editor-mode-switcher">
				<button
					className="editor-mode-switcher__toggle"
					onClick={ this.toggle }
					aria-label="Switch the editor mode"
				>
					{ currentMode.label }
					<span className="dashicons dashicons-arrow-down" />
				</button>
				{ opened &&
					<div className="editor-mode-switcher__content">
						<div className="editor-mode-switcher__arrow" />
						{ modes.map( ( mode ) =>
							<button key={ mode.value } type="button" onClick={ switchMode( mode.value ) }>
								{ mode.label }
							</button>
						) }
					</div>
				}
			</div>
		);
	}
}

export default ModeSwitcher;
