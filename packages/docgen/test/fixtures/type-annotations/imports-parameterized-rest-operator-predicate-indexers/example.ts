function fn(
	foo: import('react').bar.baz.types.ComponentType[ 'displayName' ],
	...rest: [ string | number, ...( keyof constant ) ]
): foo is string {}
