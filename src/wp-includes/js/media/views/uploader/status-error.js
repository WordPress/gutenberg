/**
 * wp.media.view.UploaderStatusError
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var UploaderStatusError = wp.media.View.extend(/** @lends wp.media.view.UploaderStatusError.prototype */{
	className: 'upload-error',
	template:  wp.template('uploader-status-error')
});

module.exports = UploaderStatusError;
