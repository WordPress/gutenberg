/**
 * wp.media.view.MediaFrame.Manage.Router
 *
 * A router for handling the browser history and application state.
 *
 * @memberOf wp.media.view.MediaFrame.Manage
 *
 * @class
 * @augments Backbone.Router
 */
var Router = Backbone.Router.extend(/** @lends wp.media.view.MediaFrame.Manage.Router.prototype */{
	routes: {
		'upload.php?item=:slug&mode=edit': 'editItem',
		'upload.php?item=:slug':           'showItem',
		'upload.php?search=:query':        'search',
		'upload.php':                      'reset'
	},

	// Map routes against the page URL
	baseUrl: function( url ) {
		return 'upload.php' + url;
	},

	reset: function() {
		var frame = wp.media.frames.edit;

		if ( frame ) {
			frame.close();
		}
	},

	// Respond to the search route by filling the search field and trigggering the input event
	search: function( query ) {
		jQuery( '#media-search-input' ).val( query ).trigger( 'input' );
	},

	// Show the modal with a specific item
	showItem: function( query ) {
		var media = wp.media,
			frame = media.frames.browse,
			library = frame.state().get('library'),
			item;

		// Trigger the media frame to open the correct item
		item = library.findWhere( { id: parseInt( query, 10 ) } );
		item.set( 'skipHistory', true );

		if ( item ) {
			frame.trigger( 'edit:attachment', item );
		} else {
			item = media.attachment( query );
			frame.listenTo( item, 'change', function( model ) {
				frame.stopListening( item );
				frame.trigger( 'edit:attachment', model );
			} );
			item.fetch();
		}
	},

	// Show the modal in edit mode with a specific item.
	editItem: function( query ) {
		this.showItem( query );
		wp.media.frames.edit.content.mode( 'edit-details' );
	}
});

module.exports = Router;
