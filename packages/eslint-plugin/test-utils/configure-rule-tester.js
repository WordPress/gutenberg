import { RuleTester } from 'eslint';

export default function configureRuleTester( { describe, it } ) {
	RuleTester.describe = describe;
	RuleTester.it = it;
	RuleTester.itOnly = it.only;

	return RuleTester;
}
