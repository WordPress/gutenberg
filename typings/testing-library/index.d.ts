/// <reference types="jest"/>

declare namespace jest {
	interface Matchers< R, T > {
		/**
		 * Similar to `toMatchDiffSnapshot`, but only taking into account the style
		 * rules associated to the two elements being compared.
		 */
		toMatchStyleDiffSnapshot( expected: Element ): R;
	}
}
