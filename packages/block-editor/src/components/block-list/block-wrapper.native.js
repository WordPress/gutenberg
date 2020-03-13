const elements = [
	'p',
	'div',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'ol',
	'ul',
	'li',
	'figure',
	'nav',
];

const ExtendedBlockComponent = elements.reduce( ( acc, element ) => {
	acc[ element ] = element;
	return acc;
}, String );

export const Block = ExtendedBlockComponent;
