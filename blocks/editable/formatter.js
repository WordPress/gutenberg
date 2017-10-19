export function createInlineStyleFormatter( name, icon, title, style ) {
	return {
		format: name,
		icon,
		title,
		formatter: {
			inline: 'span',
			styles: style,
		},
	};
}
