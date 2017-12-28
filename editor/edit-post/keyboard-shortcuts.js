const isMac = window.navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;
const mod = isMac ? '⌘' : 'Ctrl';

export default {
	toggleEditorMode: {
		value: 'mod+shift+alt+m',
		label: `${ mod }+Shift+Alt+M`,
	},
};
