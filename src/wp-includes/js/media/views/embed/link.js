/*globals wp, _, jQuery */

/**
 * wp.media.view.EmbedLink
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var $ = jQuery,
	EmbedLink;

EmbedLink = wp.media.view.Settings.extend({
	className: 'embed-link-settings',
	template:  wp.template('embed-link-settings'),

	initialize: function() {
		this.spinner = $('<span class="spinner" />');
		this.$el.append( this.spinner[0] );
		this.listenTo( this.model, 'change:url', this.updateoEmbed );
	},

	updateoEmbed: _.debounce( function() {
		var url = this.model.get( 'url' );

		// clear out previous results
		this.$('.embed-container').hide().find('.embed-preview').empty();
		this.$( '.setting' ).hide();

		// only proceed with embed if the field contains more than 6 characters
		if ( url && url.length < 6 ) {
			return;
		}

		this.fetch();
	}, 600 ),

	fetch: function() {
		// check if they haven't typed in 500 ms
		if ( $('#embed-url-field').val() !== this.model.get('url') ) {
			return;
		}

		wp.ajax.send( 'parse-embed', {
			data : {
				post_ID: wp.media.view.settings.post.id,
				shortcode: '[embed]' + this.model.get('url') + '[/embed]'
			}
		} )
			.done( _.bind( this.renderoEmbed, this ) )
			.fail( _.bind( this.renderFail, this ) );
	},

	renderFail: function () {
		this.$( '.link-text' ).show();
	},

	renderoEmbed: function( response ) {
		var html = ( response && response.body ) || '';

		if ( html ) {
			this.$('.embed-container').show().find('.embed-preview').html( html );
		} else {
			this.renderFail();
		}
	}
});

module.exports = EmbedLink;
