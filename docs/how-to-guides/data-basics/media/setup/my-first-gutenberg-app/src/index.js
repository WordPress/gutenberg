function MyFirstApp() {
	return <span>Hello from Javascript!</span>;
}

window.addEventListener(
	'load',
	function () {
		window.wp.element.render(
			<MyFirstApp />,
			document.querySelector( '#my-first-gutenberg-app' )
		);
	},
	false
);
