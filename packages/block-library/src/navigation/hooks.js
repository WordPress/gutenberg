// Used with the default, horizontal flex orientation.
const justifyContentMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
	'space-between': 'space-between',
};

// Used with the vertical (column) flex orientation.
const alignItemsMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
};

export function addStylesToLayout(
	styleContent,
	selector,
	appendSelectors,
	layout
) {
	if ( ! layout ) {
		return styleContent;
	}

	const { orientation = 'horizontal' } = layout;
	const justifyContent =
		justifyContentMap[ layout.justifyContent ] || justifyContentMap.left;
	const alignItems =
		alignItemsMap[ layout.justifyContent ] || alignItemsMap.left;

	let customProperties = ``;

	if ( orientation === 'horizontal' ) {
		// --layout-justification-setting allows children to inherit the value
		// regardless or row or column direction.
		customProperties += `
		--layout-justification-setting: ${ justifyContent };
			--layout-direction: row;
			--layout-wrap: ${ layout.flexWrap || 'wrap' };
			--layout-justify: ${ justifyContent };
			--layout-align: center;
			`;
	} else {
		customProperties += `
		--layout-justification-setting: ${ alignItems };
		--layout-direction: column;
		--layout-justify: initial;
		--layout-align: ${ alignItems };
		`;
	}

	return `${ styleContent } ${ appendSelectors( selector ) } {
		${ customProperties }
	}`;
}
