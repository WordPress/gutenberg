function fn( foo: {
	( bar: string ): void;
	bar: string;
	optionalBar?: 'left' | 'right';
	[ key: number ]: string;
} ): {
	( bar: string ): void;
	bar: string;
	optionalBar?: 'left' | 'right';
	[ key: number ]: string;
} {}
