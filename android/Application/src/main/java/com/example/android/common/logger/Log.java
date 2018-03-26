/*
 * Copyright (C) 2013 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.android.common.logger;

/**
 * Helper class for a list (or tree) of LoggerNodes.
 *
 * <p>When this is set as the head of the list,
 * an instance of it can function as a drop-in replacement for {@link android.util.Log}.
 * Most of the methods in this class server only to map a method call in Log to its equivalent
 * in LogNode.</p>
 */
public class Log {
    // Grabbing the native values from Android's native logging facilities,
    // to make for easy migration and interop.
    public static final int NONE = -1;
    public static final int VERBOSE = android.util.Log.VERBOSE;
    public static final int DEBUG = android.util.Log.DEBUG;
    public static final int INFO = android.util.Log.INFO;
    public static final int WARN = android.util.Log.WARN;
    public static final int ERROR = android.util.Log.ERROR;
    public static final int ASSERT = android.util.Log.ASSERT;

    // Stores the beginning of the LogNode topology.
    private static LogNode mLogNode;

    /**
     * Returns the next LogNode in the linked list.
     */
    public static LogNode getLogNode() {
        return mLogNode;
    }

    /**
     * Sets the LogNode data will be sent to.
     */
    public static void setLogNode(LogNode node) {
        mLogNode = node;
    }

    /**
     * Instructs the LogNode to print the log data provided. Other LogNodes can
     * be chained to the end of the LogNode as desired.
     *
     * @param priority Log level of the data being logged. Verbose, Error, etc.
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void println(int priority, String tag, String msg, Throwable tr) {
        if (mLogNode != null) {
            mLogNode.println(priority, tag, msg, tr);
        }
    }

    /**
     * Instructs the LogNode to print the log data provided. Other LogNodes can
     * be chained to the end of the LogNode as desired.
     *
     * @param priority Log level of the data being logged. Verbose, Error, etc.
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged. The actual message to be logged.
     */
    public static void println(int priority, String tag, String msg) {
        println(priority, tag, msg, null);
    }

   /**
     * Prints a message at VERBOSE priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void v(String tag, String msg, Throwable tr) {
        println(VERBOSE, tag, msg, tr);
    }

    /**
     * Prints a message at VERBOSE priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     */
    public static void v(String tag, String msg) {
        v(tag, msg, null);
    }


    /**
     * Prints a message at DEBUG priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void d(String tag, String msg, Throwable tr) {
        println(DEBUG, tag, msg, tr);
    }

    /**
     * Prints a message at DEBUG priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     */
    public static void d(String tag, String msg) {
        d(tag, msg, null);
    }

    /**
     * Prints a message at INFO priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void i(String tag, String msg, Throwable tr) {
        println(INFO, tag, msg, tr);
    }

    /**
     * Prints a message at INFO priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     */
    public static void i(String tag, String msg) {
        i(tag, msg, null);
    }

    /**
     * Prints a message at WARN priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void w(String tag, String msg, Throwable tr) {
        println(WARN, tag, msg, tr);
    }

    /**
     * Prints a message at WARN priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     */
    public static void w(String tag, String msg) {
        w(tag, msg, null);
    }

    /**
     * Prints a message at WARN priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void w(String tag, Throwable tr) {
        w(tag, null, tr);
    }

    /**
     * Prints a message at ERROR priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void e(String tag, String msg, Throwable tr) {
        println(ERROR, tag, msg, tr);
    }

    /**
     * Prints a message at ERROR priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     */
    public static void e(String tag, String msg) {
        e(tag, msg, null);
    }

    /**
     * Prints a message at ASSERT priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void wtf(String tag, String msg, Throwable tr) {
        println(ASSERT, tag, msg, tr);
    }

    /**
     * Prints a message at ASSERT priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param msg The actual message to be logged.
     */
    public static void wtf(String tag, String msg) {
        wtf(tag, msg, null);
    }

    /**
     * Prints a message at ASSERT priority.
     *
     * @param tag Tag for for the log data. Can be used to organize log statements.
     * @param tr If an exception was thrown, this can be sent along for the logging facilities
     *           to extract and print useful information.
     */
    public static void wtf(String tag, Throwable tr) {
        wtf(tag, null, tr);
    }
}
