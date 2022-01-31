function MyFirstApp() {
	return window.wp.element.createElement(
		'span',
		{},
		'Hello from JavaScript!'
	);
}

window.addEventListener(
	'load',
	function () {
		window.wp.element.render(
			window.wp.element.createElement( MyFirstApp ),
			document.querySelector( '#my-first-gutenberg-app' )
		);
	},
	false
);
