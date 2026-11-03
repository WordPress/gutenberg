export default function isEmptyString( testString?: string ) {
	return testString?.trim()?.length === 0;
}
