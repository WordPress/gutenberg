/* global wp, JSON */
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
		'User',
		'UsersMe',
		'Settings'
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
					theModel2.set( 'id', theModel.attributes.id );
					theModel2.fetch().done( function() {

						// We were able to retrieve the model.
						assert.equal(
							theModel.attributes.id,
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

	// Find models by route.
	var modelsToFetchByRoute = [
		'Category',
		'Comment',
		'Media',
		'Page',
		'PageRevision',
		'Post',
		'PostRevision',
		'Status',
		'Tag',
		'Taxonomy',
		'Type',
		'User'
	];

	_.each( modelsToFetchByRoute, function( model ) {
		QUnit.test( 'Test fetching ' + model + ' by route.', function( assert ) {

			var done = assert.async();

			assert.expect( 1 );

			wp.api.loadPromise.done( function() {

				var theModel = wp.api.models[ model ];
				var route = theModel.prototype.route.index;

				assert.equal(
					wp.api.getModelByRoute( route ),
					theModel,
					'wp.api.models.' + model + ' found at route ' + route
				);

				// Trigger Qunit async completion.
				done();
			} );
		} );
	} );

	// Find collections by route.
	var collectionsToFetchByRoute = [
		'Categories',
		'Comments',
		'Media',
		'PageRevisions',
		'Pages',
		'PostRevisions',
		'Posts',
		'Statuses',
		'Tags',
		'Taxonomies',
		'Types',
		'Users'
	];

	_.each( collectionsToFetchByRoute, function( collection ) {
		QUnit.test( 'Test fetching ' + collection + ' by route.', function( assert ) {

			var done = assert.async();

			assert.expect( 1 );

			wp.api.loadPromise.done( function() {

				var theCollection = wp.api.collections[ collection ];
				var route = theCollection.prototype.route.index;

				assert.equal(
					wp.api.getCollectionByRoute( route ),
					theCollection,
					'wp.api.collections.' + collection + ' found at ' + route
				);

				// Trigger Qunit async completion.
				done();
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

	// Test that models have the correct requireForceForDelete setting.
	var modelsThatNeedrequireForceForDelete = [
		{ name: 'Category', expect: true },
		{ name: 'Comment', expect: undefined },
		{ name: 'Media', expect: undefined },
		{ name: 'Page', expect: undefined },
		{ name: 'PageRevision', expect: true },
		{ name: 'Post', expect: undefined },
		{ name: 'PostRevision', expect: true },
		{ name: 'Status', expect: undefined },
		{ name: 'Tag', expect: true },
		{ name: 'Taxonomy', expect: undefined },
		{ name: 'Type', expect: undefined },
		{ name: 'User', expect: true }
	];

	_.each( modelsThatNeedrequireForceForDelete, function( model ) {
		QUnit.test( 'Test requireForceForDelete is correct for ' + model.name, function( assert ) {
			var done = assert.async();
			assert.expect( 1 );
			wp.api.loadPromise.done( function() {

				// Instantiate the model.
				var theModel = new wp.api.models[ model.name ]();

				// Verify the model's requireForceForDelete is set as expected.
				assert.equal(
					theModel.requireForceForDelete,
					model.expect,
					'wp.api.models.' + model.name + '.requireForceForDelete should be ' + model.expect + '.'
				);

				// Trigger Qunit async completion.
				done();
			} );
		} );
	} );


	var theModelTypesWithMeta = [
		'Posts',
		'Comments',
		'Tags',
		'Users'
	];

	_.each( theModelTypesWithMeta, function( modelType ) {

		// Test post meta.
		wp.api.loadPromise.done( function() {
			QUnit.test( 'Check meta support for ' + modelType + '.', function( assert ) {
				var theModels = new wp.api.collections[ modelType ]();

				theModels.fetch().done( function() {

					// Get the main endpoint.
					var endpoint = theModels.at(0);

					// Verify the meta object returned correctly from `getMetas()`.
					assert.equal( JSON.stringify( endpoint.getMetas() ), '{"meta_key":"meta_value"}', 'Full meta key/values object should be readable.' );

					// Verify single meta returned correctly from `getMeta()`
					assert.equal( endpoint.getMeta( 'meta_key' ), 'meta_value', 'Single meta should be readable by key.' );

					// Verify setting meta values with `setMetas()`.
					endpoint.setMetas( { 'test_key':'test_value' } );
					assert.equal( endpoint.getMeta( 'test_key' ), 'test_value', 'Multiple meta should be writable via setMetas.' );

					// Verify setting a single meta value with `setMeta()`.
					endpoint.setMeta( 'test_key2', 'test_value2' );
					assert.equal( endpoint.getMeta( 'test_key2' ), 'test_value2', 'Single meta should be writable via setMeta.' );

				} );
			} );
		} );
	} );


} )( window.QUnit );
