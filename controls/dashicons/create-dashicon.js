/* eslint-disable wpcalypso/jsx-classname-namespace */

export default function createDashicon( icon ) {
	icon = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 20 20"
			className="dashicon">
			{ icon }
		</svg>
	);

	return () => icon;
}
