/* global wp */
( function( QUnit ) {
	module( 'wpapi' );

	QUnit.test( 'API Loaded correctly', function( assert ) {
		var done = assert.async();
		assert.expect( 2 );

		assert.ok( wp.api.loadPromise );

		wp.api.loadPromise.done( function() {
			assert.ok( wp.api.models );
			done();
		} );

	} );

	// The list of collections we should check.
	var collectionClassNames = [
		'Categories',
		'Comments',
		'Media',
		'Pages',
		'Posts',
		'Statuses',
		'Tags',
		'Taxonomies',
		'Types',
		'Users'
	];

	// Collections that should get helpers tested.
	var collectionHelperTests = [
		{
			'collectionType':   'Posts',
			'returnsModelType': 'post',
			'supportsMethods':  {
				'getDate':          'getDate',
				'getRevisions':     'getRevisions',
				'getTags':          'getTags',
				'getCategories':    'getCategories',
				'getAuthorUser':    'getAuthorUser',
				'getFeaturedMedia': 'getFeaturedMedia'
				/*'getMeta':        'getMeta', currently not supported */
			}
		},
		{
			'collectionType':   'Pages',
			'returnsModelType': 'page',
			'supportsMethods':  {
				'getDate':          'getDate',
				'getRevisions':     'getRevisions',
				'getAuthorUser':    'getAuthorUser',
				'getFeaturedMedia': 'getFeaturedMedia'
			}
		}
	];

	_.each( collectionClassNames, function( className ) {
		QUnit.test( 'Testing ' + className + ' collection.', function( assert ) {
			var done = assert.async();

			wp.api.loadPromise.done( function() {
				var theCollection = new wp.api.collections[ className ]();
				assert.ok(
					theCollection,
					'We can instantiate wp.api.collections.' + className
				);
				theCollection.fetch().done( function() {
					assert.equal(
						1,
						theCollection.state.currentPage,
						'We should be on page 1 of the collection in ' + className
					);

						// Should this collection have helper methods?
						var collectionHelperTest = _.findWhere( collectionHelperTests, { 'collectionType': className } );

						// If we found a match, run the tests against it.
						if ( ! _.isUndefined( collectionHelperTest ) ) {

							// Test the first returned model.
							var firstModel = theCollection.at( 0 );

							// Is the model the right type?
							assert.equal(
								collectionHelperTest.returnsModelType,
								firstModel.get( 'type' ),
								'The wp.api.collections.' + className + ' is of type ' + collectionHelperTest.returnsModelType
							);

							// Does the model have all of the expected supported methods?
							_.each( collectionHelperTest.supportsMethods, function( method ) {
								assert.equal(
									'function',
									typeof firstModel[ method ],
									className + '.' + method + ' is a function.'
								);
							} );
						}

					// Trigger Qunit async completion.
					done();
				} );

			} );

		} );
	} );

	// The list of models we should check.
	var modelsWithIdsClassNames = [
		'Category',
		'Media',
		'Page',
		'Post',
		'Tag',
		'User'
	];

	_.each( modelsWithIdsClassNames, function( className ) {

		QUnit.test( 'Checking ' + className + ' model.' , function( assert ) {
			var done = assert.async();

			assert.expect( 2 );

			wp.api.loadPromise.done( function() {
				var theModel = new wp.api.models[ className ]();
				assert.ok( theModel, 'We can instantiate wp.api.models.' + className );
				theModel.fetch().done( function(  ) {
					var theModel2 = new wp.api.models[ className ]();
					theModel2.set( 'id', theModel.attributes[0].id );
					theModel2.fetch().done( function() {

						// We were able to retrieve the model.
						assert.equal(
							theModel.attributes[0].id,
							theModel2.get( 'id' ) ,
							'We should be able to get a ' + className
						);

						// Trigger Qunit async completion.
						done();
					} );
				} );

			} );

		} );
	} );

	var modelsWithIndexes = [
		'Taxonomy',
		'Status',
		'Type'
	];

	_.each( modelsWithIndexes, function( className ) {

		QUnit.test( 'Testing ' + className + ' model.' , function( assert ) {
			var done = assert.async();

			assert.expect( 2 );

			wp.api.loadPromise.done( function(  ) {

				var theModel = new wp.api.models[ className ]();
				assert.ok( theModel, 'We can instantiate wp.api.models.' + className );
				theModel.fetch().done( function(  ) {
					var theModel2 = new wp.api.models[ className ]();

					if ( ! _.isUndefined( theModel.attributes[0] ) ) {
						theModel2.set( 'id', theModel.attributes[0].id );
					}

					theModel2.fetch().done( function() {
						// We were able to retrieve the model.
						assert.notEqual(
							0,
							_.keys( theModel2.attributes ).length ,
							'We should be able to get a ' + className
						);

						// Trigger Qunit async completion.
						done();
					} );
				} );

			} );

		} );
	} );

	// Test the jswidget custom namespace and endpoints.
	wp.api.init( {
		'versionString': 'js-widgets/v1/'
	} ).done( function() {
		var customClasses = [
			'WidgetsArchives',
			'WidgetsCalendar',
			'WidgetsCategories',
			'WidgetsMeta',
			'WidgetsNav_menu',
			'WidgetsPages',
			'WidgetsPostCollection',
			'WidgetsRecentComments',
			'WidgetsRecentPosts',
			'WidgetsRss',
			'WidgetsSearch',
			'WidgetsTag_cloud',
			'WidgetsText'
		];

		// Check that we have and can get each model type.
		_.each( customClasses, function( className ) {
			QUnit.test( 'Checking ' + className + ' class name.' , function( assert ) {
				var done = assert.async();

				assert.expect( 2 );

				wp.api.loadPromise.done( function() {
					var theModel = new wp.api.models[ className ]();
					assert.ok( theModel, 'We can instantiate wp.api.models.' + className );
					var theCollection = new wp.api.collections[ className ]();
					assert.ok( theCollection, 'We can instantiate wp.api.collections.' + className );
					// Trigger Qunit async completion.
					done();
				} );
			} );
		} );

	} );

	// Check connecting to a second URL.
	wp.api.loadPromise.done( function() {
		QUnit.test( 'Checking connecting to a remote url.' , function( assert ) {
			var done = assert.async();

			wp.api.init({
				'apiRoot': 'http://remotehost/wp-json/'
			} ).done( function(){
				var lastEndpoint = wp.api.endpoints.last(),
					models = lastEndpoint.get( 'models' ),
					post = new models.Post();

				assert.equal( 'http://remotehost/wp-json/wp/v2/posts', post.url(), 'The remote API objects should have their own URLs' );

				wp.api.init({
					'apiRoot': 'http://localhost/wp-json/'
				} ).done( function(){
					var lastEndpoint = wp.api.endpoints.first(),
						models = lastEndpoint.get( 'models' ),
						post = new models.Post();

					assert.equal( 'http://localhost/wp-json/wp/v2/posts', post.url(), 'The local API objects should have their own URLs' );

					done();
				} );
			} );
		} );
	});

} )( window.QUnit );
