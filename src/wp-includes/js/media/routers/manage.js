/*globals wp, Backbone */

/**
 * wp.media.view.MediaFrame.Manage.Router
 *
 * A router for handling the browser history and application state.
 *
 * @class
 * @augments Backbone.Router
 */
var Router = Backbone.Router.extend({
	initialize: function ( options ) {
		this.controller = options.controller;
		this.library = options.library;
		this.on( 'route', this.checkRoute );
	},

	routes: {
		'upload.php?item=:slug':    'showItem',
		'upload.php?search=:query': 'search',
		'upload.php':				'defaultRoute'
	},

	checkRoute: function ( event ) {
		if ( 'defaultRoute' !== event ) {
			this.modal = true;
		}
	},

	defaultRoute: function () {
		if ( this.modal ) {
			wp.media.frame.close();
			this.modal = false;
		}
	},

	// Map routes against the page URL
	baseUrl: function( url ) {
		return 'upload.php' + url;
	},

	// Respond to the search route by filling the search field and trigggering the input event
	search: function( query ) {
		jQuery( '#media-search-input' ).val( query ).trigger( 'input' );
	},

	// Show the modal with a specific item
	showItem: function( query ) {
		var frame = this.controller,
			item;
	
		// Trigger the media frame to open the correct item
		item = this.library.findWhere( { id: parseInt( query, 10 ) } );
		if ( item ) {
			frame.trigger( 'edit:attachment', item );
		} else {
			item = wp.media.attachment( query );
			frame.listenTo( item, 'change', function( model ) {
				frame.stopListening( item );
				frame.trigger( 'edit:attachment', model );
			} );
			item.fetch();
		}
	}
});

module.exports = Router;
