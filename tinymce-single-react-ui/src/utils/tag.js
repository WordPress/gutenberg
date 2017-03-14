// TODO: refactor into more modules with tests

// determine node styles 'strong,b,em,i,del,a[href]'

export const member = (arr, item) => (
	arr.indexOf(item) !== -1
)
// determine node styles 'strong,b,em,i,del,a[href]'
export const isBold = (tag) => member( [ 'STRONG', 'B' ], tag )
export const isItalic = (tag) => member( [ 'EM', 'I' ], tag )
export const isDel = (tag) => member( [ 'DEL' ], tag )
export const isLink = (tag) => member( [ 'A' ], tag )


// return the closest ancestor of 'el' matching 'selector' going no higher than the 'root'
// export const closest =  ( root, el, selector ) => {
//   if (window.Element && !Element.prototype.closest) {
//     Element.prototype.closest =
//     function(s) {
//         var matches = (rootthis.document || this.ownerDocument).querySelectorAll(s),
//             i,
//             el = this;
//         do {
//             i = matches.length;
//             while (--i >= 0 && matches.item(i) !== el) {};
//         } while ((i < 0) && (el = el.parentElement));
//         return el;
//     };
//   }
//   return Element.prototype.closest()
// }

