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
		var embed;

		// check if they haven't typed in 500 ms
		if ( $('#embed-url-field').val() !== this.model.get('url') ) {
			return;
		}

		if ( this.dfd && 'pending' === this.dfd.state() ) {
			this.dfd.abort();
		}

		embed = new wp.shortcode({
			tag: 'embed',
			attrs: _.pick( this.model.attributes, [ 'width', 'height', 'src' ] ),
			content: this.model.get('url')
		});

		this.dfd = $.ajax({
			type:    'POST',
			url:     wp.ajax.settings.url,
			context: this,
			data:    {
				action: 'parse-embed',
				post_ID: wp.media.view.settings.post.id,
				shortcode: embed.string()
			}
		})
			.done( this.renderoEmbed )
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
