export default function save( { attributes } ) {
	const { height, heightUnit } = attributes;
	const spacerHeight = heightUnit ? `${ height }${ heightUnit }` : height;

	return <div style={ { height: spacerHeight } } aria-hidden />;
}
