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
		this.listenTo( this.model, 'change:url', this.updateoEmbed );
	},

	updateoEmbed: _.debounce( function() {
		var url = this.model.get( 'url' );

		// clear out previous results
		this.$('.embed-container').hide().find('.embed-preview').empty();
		this.$( '.setting' ).hide();

		// only proceed with embed if the field contains more than 11 characters
		// Example: http://a.io is 11 chars
		if ( url && ( url.length < 11 || ! url.match(/^http(s)?:\/\//) ) ) {
			return;
		}

		this.fetch();
	}, wp.media.controller.Embed.sensitivity ),

	fetch: function() {

		// check if they haven't typed in 500 ms
		if ( $('#embed-url-field').val() !== this.model.get('url') ) {
			return;
		}

		if ( this.dfd && 'pending' === this.dfd.state() ) {
			this.dfd.abort();
		}

		this.dfd = $.ajax({
			url: wp.media.view.settings.oEmbedProxyUrl,
			data: {
				url: this.model.get( 'url' ),
				maxwidth: this.model.get( 'width' ),
				maxheight: this.model.get( 'height' ),
				_wpnonce: wp.media.view.settings.nonce.wpRestApi
			},
			type: 'GET',
			dataType: 'json',
			context: this
		})
			.done( function( response ) {
				this.renderoEmbed( {
					data: {
						body: response.html || ''
					}
				} );
			} )
			.fail( this.renderFail );
	},

	renderFail: function ( response, status ) {
		if ( 'abort' === status ) {
			return;
		}
		this.$( '.link-text' ).show();
	},

	renderoEmbed: function( response ) {
		var html = ( response && response.data && response.data.body ) || '';

		if ( html ) {
			this.$('.embed-container').show().find('.embed-preview').html( html );
		} else {
			this.renderFail();
		}
	}
});

module.exports = EmbedLink;
