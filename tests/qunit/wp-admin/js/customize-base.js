/* global wp */

jQuery( function( $ ) {
	var FooSuperClass, BarSubClass, foo, bar;

	module( 'Customize Base: Class' );

	FooSuperClass = wp.customize.Class.extend(
		{
			initialize: function ( instanceProps ) {
				$.extend( this, instanceProps || {} );
			},
			protoProp: 'protoPropValue'
		},
		{
			staticProp: 'staticPropValue'
		}
	);
	test( 'FooSuperClass is a function ', function () {
		equal( typeof FooSuperClass, 'function' );
	});
	test( 'FooSuperClass prototype has protoProp', function () {
		equal( FooSuperClass.prototype.protoProp, 'protoPropValue' );
	});
	test( 'FooSuperClass does not have protoProp', function () {
		equal( typeof FooSuperClass.protoProp, 'undefined' );
	});
	test( 'FooSuperClass has staticProp', function () {
		equal( FooSuperClass.staticProp, 'staticPropValue' );
	});
	test( 'FooSuperClass prototype does not have staticProp', function () {
		equal( typeof FooSuperClass.prototype.staticProp, 'undefined' );
	});

	foo = new FooSuperClass( { instanceProp: 'instancePropValue' } );
	test( 'FooSuperClass instance foo extended Class', function () {
		equal( foo.extended( wp.customize.Class ), true );
	});
	test( 'foo instance has protoProp', function () {
		equal( foo.protoProp, 'protoPropValue' );
	});
	test( 'foo instance does not have staticProp', function () {
		equal( typeof foo.staticProp, 'undefined' );
	});
	test( 'FooSuperClass instance foo ran initialize() and has supplied instanceProp', function () {
		equal( foo.instanceProp, 'instancePropValue' );
	});

	// @todo Test Class.constructor() manipulation
	// @todo Test Class.applicator?
	// @todo do we test object.instance?


	module( 'Customize Base: Subclass' );

	BarSubClass = FooSuperClass.extend(
		{
			initialize: function ( instanceProps ) {
				FooSuperClass.prototype.initialize.call( this, instanceProps );
				this.subInstanceProp = 'subInstancePropValue';
			},
			subProtoProp: 'subProtoPropValue'
		},
		{
			subStaticProp: 'subStaticPropValue'
		}
	);
	test( 'BarSubClass prototype has subProtoProp', function () {
		equal( BarSubClass.prototype.subProtoProp, 'subProtoPropValue' );
	});
	test( 'BarSubClass prototype has parent FooSuperClass protoProp', function () {
		equal( BarSubClass.prototype.protoProp, 'protoPropValue' );
	});

	bar = new BarSubClass( { instanceProp: 'instancePropValue' } );
	test( 'BarSubClass instance bar its initialize() and parent initialize() run', function () {
		equal( bar.instanceProp, 'instancePropValue' );
		equal( bar.subInstanceProp, 'subInstancePropValue' );
	});

	test( 'BarSubClass instance bar extended FooSuperClass', function () {
		equal( bar.extended( FooSuperClass ), true );
	});

});
