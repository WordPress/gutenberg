# Disallow using a hyphenated numerical ranges in translatable strings (i18n-hyphen-range)

Using hyphenated numerical ranges in translatable strings is incompatible with Android linting rules and can lead to translation pipeline issues. See [Android Lint: TypographyDashes](https://android.googlesource.com/platform/tools/base/+/master/lint/libs/lint-checks/src/main/java/com/android/tools/lint/checks/TypographyDetector.java#58) for more information.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( '1-10' );
__( '1 - 10' );
__( '1  -  10' );
```

Examples of **correct** code for this rule:

```js
__( '-10' );
__( '1–10' ); // Note the use of 'en' dash (U+2013) vs hyphen (U+002D)
__( '1—10' ); // Note use of 'em' dash (U+2014) vs hyphen (U+002D)
__( '1\u201310' );
__( 'Text - with a hyphen - is fine.' );
```
