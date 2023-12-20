declare namespace jest {
	interface Matchers< R > {
		/**
		 * Similar to the [`toMatchDiffSnapshot` matcher], this custom matcher
		 * allows to snapshot only the difference between the _styles_ associated
		 * with different states of a component.
		 *
		 * @see [to-match-style-diff-snapshot.js]
		 * @see [Testing Overview docs]
		 * @cite https://github.com/testing-library/react-testing-library/issues/36#issuecomment-440442300
		 *
		 * [`toMatchDiffSnapshot` matcher]: https://github.com/jest-community/snapshot-diff
		 * [to-match-style-diff-snapshot.js]: https://github.com/WordPress/gutenberg/blob/trunk/test/unit/config/matchers/to-match-style-diff-snapshot.js
		 * [Testing Overview docs]: https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/testing-overview.md#best-practices
		 */
		toMatchStyleDiffSnapshot( expected: Element | null ): R;
	}
}
