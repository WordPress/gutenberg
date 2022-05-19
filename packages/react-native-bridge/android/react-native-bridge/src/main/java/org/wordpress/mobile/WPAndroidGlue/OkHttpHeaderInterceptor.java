package org.wordpress.mobile.WPAndroidGlue;

import org.wordpress.mobile.WPAndroidGlue.WPAndroidGlueCode.OnAuthHeaderRequestedListener;

import java.io.IOException;
import java.util.Map;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public class OkHttpHeaderInterceptor implements Interceptor {
    private OnAuthHeaderRequestedListener mOnAuthHeaderRequestedListener;

    void setOnAuthHeaderRequestedListener(OnAuthHeaderRequestedListener onAuthHeaderRequestedListener) {
        mOnAuthHeaderRequestedListener = onAuthHeaderRequestedListener;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request.Builder builder = chain.request().newBuilder();

        Map<String, String> authHeaders = mOnAuthHeaderRequestedListener != null
                ? mOnAuthHeaderRequestedListener.onAuthHeaderRequested(chain.request().url().toString()) : null;

        if (authHeaders != null) {
            for (Map.Entry<String, String> entry : authHeaders.entrySet()) {
                builder.addHeader(entry.getKey(), entry.getValue());
            }
        }

        return chain.proceed(builder.build());
    }
}
