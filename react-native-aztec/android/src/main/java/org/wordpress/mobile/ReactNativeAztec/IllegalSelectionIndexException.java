package org.wordpress.mobile.ReactNativeAztec;

import org.jetbrains.annotations.NotNull;
import org.wordpress.aztec.spans.UnknownHtmlSpan;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class IllegalSelectionIndexException extends Exception {
    IllegalSelectionIndexException(int selectionStart, int selectionEnd, int textLength, ReactAztecText view) {
        super(createMessage(selectionStart, selectionEnd, textLength, getHtmlTags(view, textLength)));
    }

    private static String createMessage(int selectionStart, int selectionEnd, int textLength, List<String> tags) {
        return "Illegal selection index for text with length " + textLength +
               ", selectionStart: " + selectionStart +
               ", selectionEnd: " + selectionEnd +
               ", with " + UnknownHtmlSpan.class.getSimpleName() + " tags: " + tags;
    }

    @NotNull
    private static List<String> getHtmlTags(ReactAztecText view, int textLength) {
        List<String> tags = new ArrayList<>();
        Pattern tagPattern = Pattern.compile("<([^\\\\s>/]+)>");
        for (UnknownHtmlSpan span : view.getText().getSpans(0, textLength, UnknownHtmlSpan.class)) {
            String rawHtml = span.getRawHtml().toString();
            Matcher matcher = tagPattern.matcher(rawHtml);
            while (matcher.find()) {
                tags.add(matcher.group(1));
            }
        }
        return tags;
    }
}
