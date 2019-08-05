/**
 * WordPress dependencies
 */

export default function save( { attributes, className } ) {
	const { icon, url } = attributes;

	return (
		<div className={ className }>
			<a href={ url }> { icon } Icon </a>
		</div>
	);
}
