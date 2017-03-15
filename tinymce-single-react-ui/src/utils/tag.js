const member = (arr, item) => (
	arr.indexOf(item) !== -1
)
// determine node styles 'strong,b,em,i,del,a[href]'
export const isBold = (tag) => member( [ 'STRONG', 'B' ], tag )
export const isItalic = (tag) => member( [ 'EM', 'I' ], tag )
export const isDel = (tag) => member( [ 'DEL' ], tag )
export const isLink = (tag) => member( [ 'A' ], tag )
