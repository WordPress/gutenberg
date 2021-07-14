export function removeNonDigit( text, decimalNum ) {
	const regex = decimalNum > 0 ? /^(\d+\.?\,?(\d+)?)/ : /([\d]+)/;
	const result = text.match( regex );
	return result ? result[ 0 ] : '';
}

export function toFixed( num, decimalNum = 0 ) {
	return Number.parseFloat( num ).toFixed( decimalNum );
}
