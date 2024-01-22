<?php

new Gutenberg_Class();
new Non_Gutenberg_Class();
Gutenberg_Class::SOME_CLASS_CONSTANT;
Non_Gutenberg_Class::SOME_CLASS_CONSTANT;
Gutenberg_Class::some_static_method();
Non_Gutenberg_Class::some_static_method();
Gutenberg_Class::$some_class_property;
Non_Gutenberg_Class::$some_class_property;
gutenberg_function();
non_gutenberg_function();

class Gutenberg_Class {
	private function foo() {
		new Gutenberg_Class();
		new Non_Gutenberg_Class();
		Gutenberg_Class::SOME_CLASS_CONSTANT;
		Non_Gutenberg_Class::SOME_CLASS_CONSTANT;
		Gutenberg_Class::some_static_method();
		Non_Gutenberg_Class::some_static_method();
		Gutenberg_Class::$some_class_property;
		Non_Gutenberg_Class::$some_class_property;
		gutenberg_function();
		non_gutenberg_function();
	}
}

class Non_Gutenberg_Class {
	// Some code.

	private function foo() {
		new Gutenberg_Class();
		new Non_Gutenberg_Class();
		Gutenberg_Class::SOME_CLASS_CONSTANT;
		Non_Gutenberg_Class::SOME_CLASS_CONSTANT;
		Gutenberg_Class::some_static_method();
		Non_Gutenberg_Class::some_static_method();
		Gutenberg_Class::$some_class_property;
		Non_Gutenberg_Class::$some_class_property;
		gutenberg_function();
		non_gutenberg_function();
	}
}

// Gutenberg_Class.
//Gutenberg_Class.

// Non_Gutenberg_Class.
//Non_Gutenberg_Class.
