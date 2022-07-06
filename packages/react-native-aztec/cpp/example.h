#ifndef EXAMPLE_H
#define EXAMPLE_H

#include <map>
#include <unordered_map>
#include <jsi/jsi.h>
#include <mutex>

namespace facebook {
    namespace jsi {
        class Runtime;
    }
}

namespace example {
    class EventHandlerRegistry {
        std::map<int, std::shared_ptr<facebook::jsi::Object>> eventHandlers;
        std::mutex instanceMutex;

        public:
            static std::shared_ptr<EventHandlerRegistry> registry;

            void registerHandler(int id, std::shared_ptr<facebook::jsi::Object> callback);
            void processEvent(facebook::jsi::Runtime &jsiRuntime, int id, const char* eventName, const char* content, int selectionStart, int selectionEnd, long timestamp);
    };

    void install(facebook::jsi::Runtime &jsiRuntime);
}

#endif /* EXAMPLE_H */
