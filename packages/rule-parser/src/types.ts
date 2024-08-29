export type Value = string | number | boolean;
export type Source = Value | Value[];
export type Target = Value | Value[];
export type Operator = string;
export type Combinator = 'ANY' | 'ALL';
export type Store = Record< string, Source >;
/**
 * A rule is a tuple of source, operator, and target.
 * Source can either be raw (e.g. "cart.cartTotal") or a resolved value (e.g. 100).
 */
type PrimitiveRule< T > = [ T, Operator, Target ];
export type RawRule = PrimitiveRule< string >;
export type Rule = PrimitiveRule< Source >;
/**
 * A collection of rules can be an array of rules or a pair of combinator and an array of rules. Rules can be nested. Lack of initial combinator defaults to 'AND'.
 */
export type Rules< T extends RawRule | Rule | boolean > =
	| [ Combinator, Array< T | Rules< T > > ]
	| Array< T | Rules< T > >;
/**
 * StrictRules are like Rules, but they are not allowed to be an array of Rules, they need to have a combinator.
 */
export type StrictRules< T extends RawRule | Rule | boolean > = Exclude<
	Rules< T >,
	Array< T | Rules< T > >
>;

export type EvaluatorFunction = (
	source: Source,
	target: Target,
	rule: Rule,
	...args: any[]
) => boolean;
