/**
 * wp.media.view.Search
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var l10n = wp.media.view.l10n,
	Search;

Search = wp.media.View.extend({
	tagName:   'input',
	className: 'search',
	id:        'media-search-input',

	attributes: {
		type:        'search',
		placeholder: l10n.searchMediaPlaceholder
	},

	events: {
		'input':  'search',
		'keyup':  'search'
	},

	/**
	 * @returns {wp.media.view.Search} Returns itself to allow chaining
	 */
	render: function() {
		this.el.value = this.model.escape('search');
		return this;
	},

	search: _.debounce( function( event ) {
		if ( event.target.value ) {
			this.model.set( 'search', event.target.value );
		} else {
			this.model.unset('search');
		}
	}, 300 )
});

module.exports = Search;
