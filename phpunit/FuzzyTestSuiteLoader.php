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
 * Let's disable the conflicting Gutenberg phpcs inspections.
 *
 * The code in this file conforms to PHPUnit coding standards.
 * We need to preserve the original signatures with type annotations
 * and the camel-cased arguments names, as renaming parameters is
 * considered a breaking change in PHP8.
 */
// phpcs:disable PHPCompatibility.FunctionDeclarations.NewParamTypeDeclarations.stringFound
// phpcs:disable PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.stringFound
// phpcs:disable PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.class_nameFound
// phpcs:disable WordPress.NamingConventions.ValidVariableName.InterpolatedVariableNotSnakeCase
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
	public function load( string $suiteClassFile ): ReflectionClass {
		$suiteClassName = $this->findTestClass( $suiteClassFile );

		try {
			$class = new ReflectionClass( $suiteClassName );
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
				"Class '$suiteClassName' could not be found in '$suiteClassFile'."
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
				"Class '$suiteClassName' could not be found in '$suiteClassFile'."
			);
		}

		return $class;
	}

	protected function findTestClass( $suiteClassFile ): string {
		$suiteClassName = basename( $suiteClassFile, '.php' );
		if ( class_exists( $suiteClassName, false ) ) {
			return $suiteClassName;
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
		$classesLoadedAfter = get_declared_classes();
		FileLoader::checkAndLoad( $suiteClassFile );
		$classesLoadedBefore = get_declared_classes();

		$allClassesFromLoadedFiles = array_values(
			array_diff(
				$classesLoadedBefore,
				$classesLoadedAfter
			)
		);
		if ( ! empty( $allClassesFromLoadedFiles ) ) {
			$comparableSuiteClassName = $this->comparable_class_name( $suiteClassName );
			foreach ( $allClassesFromLoadedFiles as $className ) {
				if ( $this->comparable_class_name( $className ) === $comparableSuiteClassName ) {
					return $className;
				}
			}
		}
		throw new Exception(
			"Class '$suiteClassName' could not be found in '$suiteClassFile'."
		);
	}

	/**
	 * Transforms a fully-qualified class name such as `\My\Custom\Class`
	 * into a comparable string such as `class`.
	 *
	 * @param string $className Fully-qualified class name.
	 *
	 * @return string Comparable class name
	 */
	protected function comparable_class_name( string $className ): string {
		// Strip away any leading namespaces: "\My\Custom\Class" -> "Class".
		$className = array_reverse( explode( '\\', $className ) )[0];
		// Normalize dashes to underscores: "Nifty-Class" -> "Nifty_Class".
		$className = str_replace( '-', '_', $className );
		// Case-fold for case-insensitive comparison.
		$className = strtolower( $className );

		return $className;
	}

	public function reload( ReflectionClass $aClass ): ReflectionClass {
		return $aClass;
	}
}
