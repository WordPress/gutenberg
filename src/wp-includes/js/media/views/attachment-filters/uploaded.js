var l10n = wp.media.view.l10n,
	Uploaded;

/**
 * wp.media.view.AttachmentFilters.Uploaded
 *
 * @memberOf wp.media.view.AttachmentFilters
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Uploaded = wp.media.view.AttachmentFilters.extend(/** @lends wp.media.view.AttachmentFilters.Uploaded.prototype */{
	createFilters: function() {
		var type = this.model.get('type'),
			types = wp.media.view.settings.mimeTypes,
			uid = window.userSettings ? parseInt( window.userSettings.uid, 10 ) : 0,
			text;

		if ( types && type ) {
			text = types[ type ];
		}

		this.filters = {
			all: {
				text:  text || l10n.allMediaItems,
				props: {
					uploadedTo: null,
					orderby: 'date',
					order:   'DESC',
					author:	 null
				},
				priority: 10
			},

			uploaded: {
				text:  l10n.uploadedToThisPost,
				props: {
					uploadedTo: wp.media.view.settings.post.id,
					orderby: 'menuOrder',
					order:   'ASC',
					author:	 null
				},
				priority: 20
			},

			unattached: {
				text:  l10n.unattached,
				props: {
					uploadedTo: 0,
					orderby: 'menuOrder',
					order:   'ASC',
					author:	 null
				},
				priority: 50
			}
		};

		if ( uid ) {
			this.filters.mine = {
				text:  l10n.mine,
				props: {
					orderby: 'date',
					order:   'DESC',
					author:  uid
				},
				priority: 50
			};
		}
	}
});

module.exports = Uploaded;
