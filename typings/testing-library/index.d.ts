/// <reference types="jest"/>

declare namespace jest {
	interface Matchers< R > {
		toMatchStyleDiffSnapshot( expected: Element ): CustomMatcherResult;
	}
}
