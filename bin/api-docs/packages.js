const packages = [
	'a11y',
	'autop',
	'blob',
	'block-editor',
	'block-library',
	'block-serialization-default-parser',
	'blocks',
	'compose',
	[ 'core-data', {
		'Autogenerated actions': 'src/actions.js',
		'Autogenerated selectors': 'src/selectors.js',
	} ],
	'data',
	'data-controls',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'e2e-test-utils',
	'edit-post',
	'element',
	'escape-html',
	'html-entities',
	'i18n',
	'keycodes',
	'plugins',
	'priority-queue',
	'redux-routine',
	'rich-text',
	'shortcode',
	'url',
	'viewport',
	'wordcount',
];

module.exports = function() {
	return packages.map( ( entry ) => {
		if ( ! Array.isArray( entry ) ) {
			entry = [ entry, { 'Autogenerated API docs': 'src/index.js' } ];
		}
		return entry;
	} );
};
