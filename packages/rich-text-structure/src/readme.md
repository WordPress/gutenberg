# Rich Text Structure

This module contains helper functions to convert HTML or a DOM tree into a rich text structure and back, and to modify the structure with functions that are similar to `String` methods, and some additional ones for formatting.

## `create( element, range, multilineTag, settings )`

## `toHTMLString( record, multilineTag )`

## `apply( record, current, multilineTag )`

## `isCollapsed( record )`

## `isEmpty( record )`

## `applyFormat( record, format, startIndex, endIndex )`

## `removeFormat( record, formatType, startIndex, endIndex )`

## `getActiveFormat( record, formatType )`

## `getTextContent( record )`

## `slice( record, startIndex, endIndex )`

## `replace( record, pattern, replacement )`

## `insert( record, recordToInsert, startIndex, endIndex )`

## `remove( record, startIndex, endIndex )`

## `split( record, startIndex, endIndex )`

## `join( records, separator )`

## `concat( ...records )`
