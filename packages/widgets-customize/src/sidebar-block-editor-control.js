const { Control } = window.wp.customize;

const SidebarBlockEditorControl = Control.extend( {
	ready() {
		this.container.css( { outline: '1px solid red' } );
	},
} );

export default SidebarBlockEditorControl;
