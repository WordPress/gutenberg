# Disallow different placeholders in singular and plural translatable strings (i18n-no-mismatched-placeholders)

The singular and plural strings passed to `_n()` and `_nx()` are formatted with the same `sprintf()` arguments, and many languages use the singular form for numbers other than one. When the two strings use different placeholders, such as `%s` in one and `%d` in the other, or the plural drops a placeholder the singular uses, one of them is usually wrong, and translators cannot tell which values they can use.

This rule reports `_n()` and `_nx()` calls where the singular and plural strings do not use the same placeholders for the same arguments. The placeholders may appear in a different order. A singular string with fewer placeholders than the plural, such as `'One block'`, is not reported by this rule.

## Rule details

Examples of **incorrect** code for this rule:

```js
_n( '%s block', '%d blocks', count );
_n( '%d block in %s', '%d blocks', count );
_n( '%1$d block in %2$s', '%1$d blocks in %3$s', count );
```

Examples of **correct** code for this rule:

```js
_n( '%d block', '%d blocks', count );
_n( '%1$d block in %2$s', 'In %2$s: %1$d blocks', count );
```
