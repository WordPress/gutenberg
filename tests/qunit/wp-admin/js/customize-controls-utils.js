/* global wp */

jQuery( function( $ ) {
	var trueMockEvent, falseMockEvent, mockElementLists, $firstMockElement, $secondMockElement, $thirdMockElement,
		BubbleTester, BubbleTesterTwoValues, bubbleTesterParent, firstBubbleTester, secondBubbleTester;

	module( 'Customizer Model Utility functions' );

	trueMockEvent = {
		type : 'keydown',
		which : 14
	};

	falseMockEvent = {
		type : 'keydown',
		which : 13
	};

	test( 'isKeydownButNotEnterEvent returns true' , function () {
		ok( wp.customize.utils.isKeydownButNotEnterEvent( trueMockEvent ) );
	});

	test( 'isKeydownButNotEnterEvent returns false' , function () {
		equal( wp.customize.utils.isKeydownButNotEnterEvent( falseMockEvent ) , false );
	});

	$firstMockElement = $( '<div id="foo"></div>' );
	$secondMockElement = $( '<li id="bar"></li>' );
	$thirdMockElement = $( '<div id="thirdElement"></div>' );

	mockElementLists = {
		first : [ $firstMockElement , $secondMockElement ],
		second : [ $secondMockElement ],
		firstInReverseOrder : [ $secondMockElement , $firstMockElement ],
		third : [ $firstMockElement, $secondMockElement ],
		thirdButLonger : [ $firstMockElement, $secondMockElement, $thirdMockElement ]
	};

	test( 'areElementListsEqual returns true' , function () {
		ok( wp.customize.utils.areElementListsEqual( mockElementLists.first , mockElementLists.first ) );
	});

	test( 'areElementListsEqual returns false' , function () {
		equal( wp.customize.utils.areElementListsEqual( mockElementLists.first , mockElementLists.second ) , false );
	});

	test( 'areElementListsEqual: lists have same values, but in reverse order' , function () {
		equal( wp.customize.utils.areElementListsEqual( mockElementLists.first , mockElementLists.firstInReverseOrder ) , false );
	});

	test( 'areElementListsEqual: lists have same values, but one is longer' , function () {
		equal( wp.customize.utils.areElementListsEqual( mockElementLists.third , mockElementLists.thirdButLonger ) , false );
	});


	bubbleTesterParent = function() {
		this.trigger = function( event , instance ) {
			this.wasChangeTriggered = true;
			this.instancePassedInTrigger = instance;
		};
		this.wasChangeTriggered = false;
		this.instancePassedInTrigger = {};
	};

	BubbleTester = wp.customize.Class.extend(
		{
			parent : new bubbleTesterParent(),
			fooValue : new wp.customize.Value()
		},
		{
			staticProperty : 'propertyValue'
		}
	);

	test( 'bubbleChildValueChanges notifies parent of change' , function() {
		firstBubbleTester = new BubbleTester();
		wp.customize.utils.bubbleChildValueChanges( firstBubbleTester , [ 'fooValue' ] );
		firstBubbleTester.fooValue.set( 'new value' );
		ok( firstBubbleTester.parent.wasChangeTriggered );
	});

	test( 'bubbleChildValueChanges passes a reference to its instance' , function() {
		ok( firstBubbleTester.parent.instancePassedInTrigger instanceof BubbleTester );
	});

	BubbleTesterTwoValues = wp.customize.Class.extend(
		{
			parent : new bubbleTesterParent(),
			exampleValue : new wp.customize.Value(),
			barValue : new wp.customize.Value()
		},
		{
			staticProperty : 'propertyValue'
		}
	);

	secondBubbleTester = new BubbleTesterTwoValues();
	wp.customize.utils.bubbleChildValueChanges( secondBubbleTester , [ 'exampleValue' , 'barValue' ] );
	secondBubbleTester.barValue.set( 'new value' );

	test( 'bubbleChildValueChanges notifies parent of change when two values are bound' , function() {
		ok( secondBubbleTester.parent.wasChangeTriggered );
	});

	test( 'bubbleChildValueChanges passes a reference to its instance when two values are bound' , function() {
		ok( secondBubbleTester.parent.instancePassedInTrigger instanceof BubbleTesterTwoValues );
	});
});
