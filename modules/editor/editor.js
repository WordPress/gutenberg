export default class Editor {
	constructor( id, settings ) {
		document.getElementById( id ).innerHTML = settings.content;
	}
}
