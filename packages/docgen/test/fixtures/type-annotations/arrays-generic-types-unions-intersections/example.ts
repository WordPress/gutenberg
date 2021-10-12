type MyType< T > = {};
function fn( foo: MyType< string | number >[] ): MyType< string & number >[] {
	return [];
}
