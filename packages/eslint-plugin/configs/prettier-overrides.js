// Prettier can conflict with particular eslint rules, so its config disables
// them. Some rules however, are subtler and particular options can be
// renabled. This ruleset re-enables some rules that are in the WordPress
// JavaScript coding standards and are mentioned in the prettier docs as
// not causing a conflict:
// https://github.com/prettier/eslint-config-prettier#special-rules
module.exports = {
	rules: {
		curly: [ 'error', 'all' ],
	},
};
