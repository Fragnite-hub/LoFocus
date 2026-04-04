package com.lofi_backend.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebRtcSignalController {

    private final SimpMessagingTemplate messagingTemplate;

    public WebRtcSignalController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Relay WebRTC signaling messages to everyone subscribed to:
     *   /topic/room/{code}/signal
     *
     * Frontend publishes to:
     *   /app/signal/{code}
     */
    @MessageMapping("/signal/{code}")
    public void relay(
            @DestinationVariable String code,
            @Payload SignalMessage msg
    ) {
        if (msg == null) return;
        messagingTemplate.convertAndSend("/topic/room/" + code + "/signal", msg);
    }

    public static class SignalMessage {
        private String from;
        private String type;   // offer | answer | ice
        private Object payload;

        public String getFrom() {
            return from;
        }

        public void setFrom(String from) {
            this.from = from;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Object getPayload() {
            return payload;
        }

        public void setPayload(Object payload) {
            this.payload = payload;
        }
    }
}

