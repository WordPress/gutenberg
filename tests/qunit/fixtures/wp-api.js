/* global mockedApiResponse, Backbone, jsWidgetsEndpointSchema */
/**
 * @var mockedApiResponse defined in wp-api-generated.js
 */

var pathToData = {
	'wp-json/wp/v2/': mockedApiResponse.Schema,
	'wp-json/wp/v2/categories': mockedApiResponse.CategoriesCollection,
	'wp-json/wp/v2/comments': mockedApiResponse.CommentsCollection,
	'wp-json/wp/v2/media': mockedApiResponse.MediaCollection,
	'wp-json/wp/v2/pages': mockedApiResponse.PagesCollection,
	'wp-json/wp/v2/posts': mockedApiResponse.PostsCollection,
	'wp-json/wp/v2/statuses': mockedApiResponse.StatusesCollection,
	'wp-json/wp/v2/tags': mockedApiResponse.TagsCollection,
	'wp-json/wp/v2/taxonomies': mockedApiResponse.TaxonomiesCollection,
	'wp-json/wp/v2/types': mockedApiResponse.TypesCollection,
	'wp-json/wp/v2/users': mockedApiResponse.UsersCollection,
	'wp-json/wp/v2/category': mockedApiResponse.CategoryModel,
	'wp-json/wp/v2/media1': mockedApiResponse.MediaModel,
	'wp-json/wp/v2/page': mockedApiResponse.PageModel,
	'wp-json/wp/v2/post': mockedApiResponse.PostModel,
	'wp-json/wp/v2/tag': mockedApiResponse.TagModel,
	'wp-json/wp/v2/user': mockedApiResponse.UserModel,
	'wp-json/wp/v2/taxonomy': mockedApiResponse.TaxonomyModel,
	'wp-json/wp/v2/status': mockedApiResponse.StatusModel,
	'wp-json/wp/v2/type': mockedApiResponse.TypeModel,
	'wp-json/js-widgets/v1/': jsWidgetsEndpointSchema
};

/**
 * Mock the ajax callbacks for our tests.
 *
 * @param  {object} param The parameters sent to the ajax request.
 *
 * @return {Object}       A jQuery defered object that resolves with the mapped data.
 */
Backbone.ajax = function ( param ) {

	var data,
		request = param.url.replace( 'http://localhost/', '' );

	if ( pathToData[ request ] ) {
		data = pathToData[ request ];
	}

	// Call success handler.
	param.success( data );
	var deferred = jQuery.Deferred();

	// Resolve the deferred with the mocked data
	deferred.resolve( data );

	// Return the deferred promise that will resolve with the expected data.
	return deferred.promise();

};
