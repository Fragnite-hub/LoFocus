package com.lofi_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");   // for subscriptions
        config.setApplicationDestinationPrefixes("/app"); // for sending
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-study")
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://lofocus.space", "https://*.lofocus.space")
                .withSockJS()
                .setSessionCookieNeeded(false);

        // Plain WebSocket endpoint (no SockJS). This is more reliable for local dev
        // when SockJS/websocket transport is being closed by the environment.
        registry.addEndpoint("/ws-study-native")
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://lofocus.space", "https://*.lofocus.space");
    }
}