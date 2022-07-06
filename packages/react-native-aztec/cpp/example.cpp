#include <jni.h>
#include "example.h"
#include <jsi/jsi.h>
#include <thread>
#include <android/log.h>
#include <sys/types.h>
using namespace facebook::jsi;
using namespace std;

namespace example {

std::shared_ptr<EventHandlerRegistry> EventHandlerRegistry::registry = std::make_shared<EventHandlerRegistry>();

void EventHandlerRegistry::registerHandler(int id, std::shared_ptr<Object> callback) {
	__android_log_print(ANDROID_LOG_VERBOSE, "TEST", "EventHandlerRegistry::registerHandler: %i", id);

    const std::lock_guard<std::mutex> lock(instanceMutex);
    eventHandlers[id] = std::move(callback);
}

void EventHandlerRegistry::processEvent(Runtime &jsiRuntime, int id, const char* eventName, const char* content, int selectionStart, int selectionEnd, long timestamp) {
    __android_log_print(ANDROID_LOG_VERBOSE, "TEST", "EventHandlerRegistry::processEvent: %i, %s", id, content);

    const std::lock_guard<std::mutex> lock(instanceMutex);

    auto handlerIt = eventHandlers.find(id);
    if (handlerIt != eventHandlers.end()) {
        auto callback = handlerIt->second;

		__android_log_print(ANDROID_LOG_VERBOSE, "TEST", "Event handler found for id: %i", id);

        callback->asFunction(jsiRuntime).call(jsiRuntime, String::createFromUtf8(jsiRuntime, eventName), String::createFromUtf8(jsiRuntime, content), selectionStart, selectionEnd, (double)timestamp);
    }
}

void install(Runtime &jsiRuntime) {
    auto registerAztecHandler = Function::createFromHostFunction(jsiRuntime,
            PropNameID::forAscii(jsiRuntime, "registerAztecHandler"),
            2,
            [](Runtime &runtime, const Value &thisValue, const Value *arguments, size_t count
        ) -> Value {

        int id = arguments[0].getNumber();
        auto callback = std::make_shared<Function>(arguments[1].getObject(runtime).asFunction(runtime));

        EventHandlerRegistry::registry->registerHandler(id, std::move(callback));

        return Value::undefined();

    });
    jsiRuntime.global().setProperty(jsiRuntime, "registerAztecHandler", std::move(registerAztecHandler));
}

}
