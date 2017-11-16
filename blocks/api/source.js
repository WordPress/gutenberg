function warnAboutDeprecatedMatcher() {
	// eslint-disable-next-line no-console
	console.warn(
		'Attributes matchers are deprecated and they will be removed in a future version of Gutenberg. ' +
		'Please update your attributes definition https://wordpress.org/gutenberg/handbook/reference/attributes/'
	);
}

export const attr = ( selector, attribute ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'attribute',
		attribute: attribute === undefined ? selector : attribute,
		selector: attribute === undefined ? undefined : selector,
	};
};

export const prop = ( selector, property ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'property',
		property: property === undefined ? selector : property,
		selector: property === undefined ? undefined : selector,
	};
};

export const html = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'html',
		selector,
	};
};

export const text = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'text',
		selector,
	};
};

export const query = ( selector, subMatchers ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'query',
		selector,
		query: subMatchers,
	};
};

export const children = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'children',
		selector,
	};
};

export const node = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'node',
		selector,
	};
};
