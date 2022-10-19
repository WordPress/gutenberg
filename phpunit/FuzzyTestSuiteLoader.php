<?php
/**
 * This file is derived from the PHPUnit project and customized for the
 * needs of the Gutenberg project.
 *
 * @package gutenberg
 */

namespace phpunit;

use PHPUnit\Framework\TestCase;
use PHPUnit\Util\FileLoader;
use PHPUnit\Runner\TestSuiteLoader;

use \Exception;
use \ReflectionClass;
use \ReflectionException;

/*
 * The code in this file conforms to PHPUnit coding standards. Let's disable
 * the conflicting Gutenberg phpcs inspections.
 */
// phpcs:disable PHPCompatibility.FunctionDeclarations.NewParamTypeDeclarations.stringFound
// phpcs:disable PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.stringFound
// phpcs:disable PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.class_nameFound
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
 */
class FuzzyTestSuiteLoader implements TestSuiteLoader {

	/**
	 * @throws Exception When no test class is detected in the $suite_class_file.
	 */
	public function load( string $suite_class_file ): ReflectionClass {
		$suite_class_name = $this->findTestClass( $suite_class_file );

		try {
			$class = new ReflectionClass( $suite_class_name );
		} catch ( ReflectionException $e ) {
			throw new Exception(
				$e->getMessage(),
				(int) $e->getCode(),
				$e
			);
		}

		if ( $class->isSubclassOf( TestCase::class ) && ! $class->isAbstract() ) {
			return $class;
		}

		if ( ! $class->hasMethod( 'suite' ) ) {
			throw new Exception(
				"Class '$suite_class_name' could not be found in '$suite_class_file'."
			);
		}

		try {
			$method = $class->getMethod( 'suite' );
		} catch ( ReflectionException $e ) {
			throw new Exception(
				$e->getMessage(),
				(int) $e->getCode(),
				$e
			);
		}

		if ( $method->isAbstract() || ! $method->isPublic() || ! $method->isStatic() ) {
			throw new Exception(
				"Class '$suite_class_name' could not be found in '$suite_class_file'."
			);
		}

		return $class;
	}

	protected function findTestClass( $suite_class_file ): string {
		$suite_class_name = basename( $suite_class_file, '.php' );
		if ( class_exists( $suite_class_name, false ) ) {
			return $suite_class_name;
		}

		/*
		 * If we didn't find the class it could be a case-folding issue.
		 * For phpunit through version 8 it would find the appropriate
		 * class to use, but at version 9 it started requiring that the
		 * name of the class exactly match the name of the file.
		 *
		 * Here we're going to get a list of all the classes defined in
		 * the test file, so we can search through them to see if we have
		 * a lexical variation of the class name that matches the filename.
		 */
		$classes_loaded_after = get_declared_classes();
		FileLoader::checkAndLoad( $suite_class_file );
		$classes_loaded_before = get_declared_classes();

		$all_classes_from_loaded_files = array_values(
			array_diff(
				$classes_loaded_before,
				$classes_loaded_after
			)
		);
		if ( ! empty( $all_classes_from_loaded_files ) ) {
			$comparablesuite_class_name = $this->comparable_class_name( $suite_class_name );
			foreach ( $all_classes_from_loaded_files as $class_name ) {
				if ( $this->comparable_class_name( $class_name ) === $comparablesuite_class_name ) {
					return $class_name;
				}
			}
		}
		throw new Exception(
			"Class '$suite_class_name' could not be found in '$suite_class_file'."
		);
	}

	/**
	 * Transforms a fully-qualified class name such as `\My\Custom\Class`
	 * into a comparable string such as `class`.
	 *
	 * @param string $class_name Fully-qualified class name.
	 * @return string Comparable class name
	 */
	protected function comparable_class_name( string $class_name ): string {
		// Strip away any leading namespaces: "\My\Custom\Class" -> "Class".
		$class_name = array_reverse( explode( '\\', $class_name ) )[0];
		// Normalize dashes to underscores: "Nifty-Class" -> "Nifty_Class".
		$class_name = str_replace( '-', '_', $class_name );
		// Case-fold for case-insensitive comparison.
		$class_name = strtolower( $class_name );

		return $class_name;
	}

	public function reload( ReflectionClass $aClass ): ReflectionClass {
		return $aClass;
	}
}
