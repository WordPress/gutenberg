export function removeNonDigit( text, decimalNum ) {
	const regex = decimalNum > 0 ? /^(\d+\.?\,?(\d+)?)/ : /([\d]+)/;
	const result = text.match( regex );
	return result ? result[ 0 ] : '';
}

export function toFixed( num, decimalNum = 0 ) {
	const fixed = Math.pow( 10, decimalNum < 0 ? 0 : decimalNum );
	return Math.floor( num * fixed ) / fixed;
}
