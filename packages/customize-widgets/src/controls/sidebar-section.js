const {
	wp: { customize },
} = window;

class SidebarSection extends customize.Section {
	onChangeExpanded( expanded, args ) {
		super.onChangeExpanded( expanded, args );

		const controls = this.controls();
		controls.forEach( ( control ) => {
			control.onChangeExpanded( expanded, args );
		} );
	}
}

export default SidebarSection;
