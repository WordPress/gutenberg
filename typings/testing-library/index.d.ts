/// <reference types="jest"/>

declare namespace jest {
	interface Matchers< R > {
		/**
		 * Similar to the [`toMatchDiffSnapshot` matcher](https://github.com/jest-community/snapshot-diff), this custom matcher allows to snapshot only the difference
		 * between the _styles_ associated to two different states of a component.
		 *
		 * @see [test/unit/config/matchers/to-match-style-diff-snapshot.js](https://github.com/WordPress/gutenberg/blob/trunk/test/unit/config/matchers/to-match-style-diff-snapshot.js)
		 * @see [Testing Overview docs](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/testing-overview.md#best-practices)
		 * @cite https://github.com/testing-library/react-testing-library/issues/36#issuecomment-440442300
		 */
		toMatchStyleDiffSnapshot( expected: Element | null ): R;
	}
}
